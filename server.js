const express = require('express');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const { analyzeImage } = require('./services/genai');

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configure multer for image upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/dicom'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG and DICOM files are allowed.'));
        }
    }
});

// Simulated user database (replace with real database in production)
const users = [
    {
        email: "demo@diagnose.ai",
        password: "demo123", // In production, use hashed passwords
        name: "Demo User",
        role: "Doctor"
    }
];

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // In production, use proper session management/JWT
        res.json({
            success: true,
            message: "Login successful",
            user: {
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: "Invalid credentials"
        });
    }
});

// Image analysis endpoint
app.post('/api/analyze', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file uploaded"
            });
        }

        // Process the image using Groq API
        const analysisResult = await analyzeImage(req.file.buffer);
        res.json(analysisResult);

    } catch (error) {
        console.error('Error during image analysis:', error);
        res.status(500).json({
            success: false,
            message: "Error processing image",
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Something went wrong!",
        error: err.message
    });
});

// Start server
app.listen(port, () => {
    console.log(`diagnose.ai server running on port ${port}`);
    console.log(`Visit http://localhost:${port} to access the application`);
});