# cloud-storage-demo

This repository contains some examples using Node.js to interact with cloud storage services at AWS, Azure, and Google Cloud.

## AWS S3

The `aws` folder contains a simple application that interacts with AWS S3. It uses the `aws-sdk` package to upload and download files from an S3 bucket.

To run the application, you need to have an AWS account and create an S3 bucket. Then, you need to create a `.env` file in the `aws` folder with the following content:

```ini
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_BUCKET=your-bucket-name
```

After that, you can run the application with the following commands:

```bash
cd aws
npm install
node app.js
```

## Azure Blob Storage

The `azure` folder contains a simple application that interacts with Azure Blob Storage. It uses the `@azure/storage-blob` package to upload and download files from a blob container.

To run the application, you need to have an Azure account and create a storage account with a blob container. Then, you need to create a `.env` file in the `azure` folder with the following content:

```ini
AZURE_STORAGE_CONNECTION_STRING=your-connection-string
AZURE_STORAGE_CONTAINER_NAME=your-container-name
```

After that, you can run the application with the following commands:

```bash
cd azure
npm install
node app.js
```

## Google Cloud Storage

The `google` folder contains a simple application that interacts with Google Cloud Storage. It uses the `@google-cloud/storage` package to upload and download files from a bucket.

To run the application, you need to have a Google Cloud account and create a storage bucket. Then, you need to create a `.env` file in the `google` folder with the following content:

```ini
GOOGLE_APPLICATION_CREDENTIALS=path-to-your-service-account-key-file
GOOGLE_BUCKET_NAME=your-bucket-name
```
