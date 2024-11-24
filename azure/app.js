require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');
const path = require('path');

const app = express();
const PORT = 3000;

// Azure Blob Storage configuration
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

function generateBlobUrl(blobName) {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    // Configure SAS parameters
    const sasOptions = {
        containerName: containerName,
        blobName: blobName,
        permissions: BlobSASPermissions.parse("r"), // Read permission
        expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 hour
    };

    // Generate SAS token
    const sasToken = generateBlobSASQueryParameters(
        sasOptions,
        blobServiceClient.credential
    ).toString();

    // Construct the URL with SAS token
    return `${blobClient.url}?${sasToken}`;
}

// Configuration to serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Route for image upload
app.post('/upload', upload.single('image'), async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobName = `images/${Date.now()}_${file.originalname}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.upload(file.buffer, file.buffer.length, {
            blobHTTPHeaders: { blobContentType: file.mimetype },
        });

        const url = blockBlobClient.url;
        res.send({ imageUrl: url });
    } catch (error) {
        console.error('Error uploading to Azure Blob Storage:', error);
        res.status(500).send('Error uploading.');
    }
});

// Route to list images
app.get('/images', async (req, res) => {
    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);

        const blobs = [];
        for await (const blob of containerClient.listBlobsFlat()) {
            blobs.push({
                name: blob.name,
                url: generateBlobUrl(blob.name),
            });
        }

        res.json(blobs);
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).send('Error fetching images.');
    }
});

// Server initialization
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
