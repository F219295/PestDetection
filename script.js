// Import required modules
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Configuration for nodemailer (replace with your SMTP settings)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'f219295@cfd.nu.edu.pk',
      pass: 'ahmed.9292',
    }
  });

// URL of the image to fetch
const imageUrl = 'http://192.168.100.59/cam-lo.jpg';
// Path to save the image locally
const imagePath = path.join(__dirname, 'images', 'cam-hi.jpg'); // Assuming 'images' folder exists

async function fetchAndSaveImage() {
    try {
        // Fetch image data
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

        // Save image locally
        fs.writeFileSync(imagePath, response.data);

        console.log('Image saved successfully.');

        // Perform detection and email if white flies detected
        await performDetectionAndEmail();

    } catch (error) {
        console.error('Error fetching or saving image:', error);
    }
}

async function performDetectionAndEmail() {
    try {
        // Read the image file
        const imageBuffer = fs.readFileSync(imagePath);

        // Convert image buffer to base64
        const base64Image = imageBuffer.toString('base64');

        // Perform detection using Roboflow API (replace with your API details)
        const apiUrl = "https://detect.roboflow.com/white-fly-detection-hjzzl/1";
        const apiKey = "hb2gvic0MAYiy5ZvwEFF";
        const detectionResponse = await axios({
            method: "POST",
            url: apiUrl,
            params: {
                api_key: apiKey
            },
            data: base64Image,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        // Process detections
        const detections = detectionResponse.data.predictions.filter(pred => pred.class === 'whitefly');
        const totalCount = detections.length;
        const accuracy = Math.round(totalCount > 1 ? (detections.reduce((acc, pred) => acc + pred.confidence, 0) / totalCount) * 100 : 0);

        console.log(`Total Count of White Flies: ${totalCount}`);
        console.log(`Accuracy: ${accuracy}%`);

        // Send email if white flies detected
        if (totalCount > 0) {
            await sendEmail(totalCount, accuracy);
        }

    } catch (error) {
        console.error('Error performing detection or sending email:', error);
    }
}

async function sendEmail(totalCount, accuracy) {
    try {
        // Email content
        const mailOptions = {
            from: 'f219295@cfd.nu.edu.pk', // replace with your email
            to: 'mussadiqahmed90@gmail.com', // replace with recipient's email
            subject: 'Warning: White Fly Detected',
            text: `Total Count of White Flies: ${totalCount}\nAccuracy: ${accuracy}%`
        };

        // Send email
        await transporter.sendMail(mailOptions);

        console.log('Email sent successfully.');

    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Periodically fetch and save the image (every 10 seconds)
setInterval(fetchAndSaveImage, 10000);

// Initial fetch and save
fetchAndSaveImage();
