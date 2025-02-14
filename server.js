const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

const app = express();
const PORT = 3000;

// Output directory for CSV files
const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

// Function to fetch data from APIs
async function fetchData() {
    try {
        const [usersResponse, postsResponse, commentsResponse] = await Promise.all([
            axios.get('https://jsonplaceholder.typicode.com/users'),
            axios.get('https://jsonplaceholder.typicode.com/posts'),
            axios.get('https://jsonplaceholder.typicode.com/comments')
        ]);

        return {
            users: usersResponse.data,
            posts: postsResponse.data,
            comments: commentsResponse.data
        };
    } catch (error) {
        throw new Error('Failed to fetch data from one or more APIs');
    }
}

// Function to process data and write to CSV
async function generateCSV() {
    try {
        const { users, posts, comments } = await fetchData();
        
        // Ensure all three data sources have the same length
        const rowCount = Math.min(users.length, posts.length, comments.length);

        const csvWriter = createObjectCsvWriter({
            path: path.join(OUTPUT_DIR, 'output.csv'),
            header: [
                { id: 'id', title: 'ID' },
                { id: 'name', title: 'Name' },
                { id: 'title', title: 'Title' },
                { id: 'body', title: 'Body' }
            ]
        });

        const records = [];
        for (let i = 0; i < rowCount; i++) {
            records.push({
                id: i + 1,
                name: users[i].name || 'N/A',
                title: posts[i].title || 'N/A',
                body: comments[i].body || 'N/A'
            });
        }

        await csvWriter.writeRecords(records);
        return path.join(OUTPUT_DIR, 'output.csv');
    } catch (error) {
        throw new Error('Error generating CSV file');
    }
}

// Route to trigger CSV generation
app.get('/generate-csv', async (req, res) => {
    try {
        const csvFilePath = await generateCSV();
        res.json({ message: 'CSV file generated successfully', filePath: csvFilePath });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
