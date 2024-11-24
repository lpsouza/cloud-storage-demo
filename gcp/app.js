require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const path = require('path');

const app = express();
const PORT = 3000;

// Google Cloud Storage configuration
const storage = new Storage();
const bucket = storage.bucket(process.env.BUCKET_NAME);

// Multer configuration
const upload = multer({ storage: multer.memoryStorage() });

// Function to generate Signed URL
async function generateSignedUrl(blobName) {
    const [url] = await bucket.file(blobName).getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });
    return url;
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Route for image upload
app.post('/upload', upload.single('image'), async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).send('No file was uploaded.');
    }

    try {
        const blob = bucket.file(`images/${Date.now()}_${file.originalname}`);
        const blobStream = blob.createWriteStream({
            resumable: false,
            contentType: file.mimetype,
        });

        blobStream.on('error', (err) => {
            console.error('Upload error:', err);
            res.status(500).send('Error uploading the file.');
        });

        blobStream.on('finish', async () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            res.send({ imageUrl: publicUrl });
        });

        blobStream.end(file.buffer);
    } catch (error) {
        console.error('Error uploading to Google Cloud Storage:', error);
        res.status(500).send('Error uploading.');
    }
});

// Route to list images
app.get('/images', async (req, res) => {
    try {
        const [files] = await bucket.getFiles({ prefix: 'images/' });
        const images = await Promise.all(
            files.map(async (file) => {
                const url = await generateSignedUrl(file.name);
                return { name: file.name, url };
            })
        );

        res.json(images);
    } catch (error) {
        console.error('Error listing images:', error);
        res.status(500).send('Error listing images.');
    }
});

// Server initialization
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
