require('dotenv').config();
const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const path = require('path');

const app = express();
const PORT = 3000;

// S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: "us-east-1",
});

const bucketName = process.env.AWS_BUCKET_NAME;

// Get a pre-signed URL to download an image
function getPresignedUrl(bucketName, key) {
    const params = {
        Bucket: bucketName,
        Key: key,
        Expires: 60 * 60 // 1 hour
    };
    return s3.getSignedUrl('getObject', params);
}

// Multer Configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configuration to serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Image upload
app.post('/upload', upload.single('image'), (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    const params = {
        Bucket: bucketName,
        Key: `images/${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    s3.upload(params, (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error uploading to S3.');
        }
        res.send({ imageUrl: data.Location });
    });
});

// List images from the bucket
app.get('/images', async (req, res) => {
    try {
        const data = await s3.listObjectsV2({ Bucket: bucketName }).promise();
        const images = data.Contents.map((item) => ({
            key: item.Key,
            url: getPresignedUrl(bucketName, item.Key)
        }));
        res.json(images);
    } catch (error) {
        console.error('Error listing objects from S3:', error);
        res.status(500).send('Error listing images');
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
