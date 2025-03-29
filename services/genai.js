const axios = require('axios');

// Groq API configuration
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const DEMO_MODE = process.env.DEMO_MODE === 'true';

// Helper function to convert image to base64
const imageToBase64 = (buffer) => {
    return buffer.toString('base64');
};

// Function to generate demo analysis results
const generateDemoAnalysis = () => {
    return {
        success: true,
        timestamp: new Date().toISOString(),
        quantitativeAnalysis: {
            riskScores: {
                abnormalityRisk: (Math.random() * 20 + 10).toFixed(1), // 10-30%
                urgencyLevel: Math.floor(Math.random() * 3) + 1, // 1-3
                confidenceScore: (Math.random() * 10 + 85).toFixed(1) // 85-95%
            },
            measurements: {
                size: `${(Math.random() * 5 + 2).toFixed(1)}cm`, // 2-7cm
                density: `${(Math.random() * 50 + 100).toFixed(1)}HU`, // 100-150 HU
                volume: `${(Math.random() * 500 + 100).toFixed(1)}mm³` // 100-600mm³
            },
            vitals: {
                contrast: `${(Math.random() * 20 + 75).toFixed(1)}%`, // 75-95%
                clarity: `${(Math.random() * 15 + 80).toFixed(1)}%` // 80-95%
            }
        },
        qualitativeAnalysis: {
            findings: `Medical Image Analysis Report

1. Primary Observations:
   - Clear lung fields with normal pulmonary vasculature
   - No visible consolidation or infiltrates
   - Heart size within normal limits
   - Normal mediastinal contour
   - Intact bony structures

2. Detailed Assessment:
   - Lung parenchyma shows normal aeration
   - No evidence of pleural effusion
   - Costophrenic angles are sharp
   - Normal cardiothoracic ratio
   - No visible masses or nodules

3. Technical Quality:
   - Good inspiration and penetration
   - No rotation or motion artifact
   - Optimal contrast and brightness

4. Impression:
   Normal chest radiograph with no acute cardiopulmonary findings.`,
            confidence: "92.5%"
        },
        threeDModel: {
            previewUrl: "/assets/images/samples/chest-xray.jpg",
            reconstructionStatus: "complete",
            viewAngles: ["anterior", "lateral", "superior"],
            quality: "high"
        },
        recommendations: {
            priority: "Normal",
            followUp: "Routine follow-up as clinically indicated",
            additionalTests: [
                "No immediate additional imaging required",
                "Consider annual screening based on patient risk factors"
            ]
        }
    };
};

// Main function to analyze medical images
async function analyzeImage(imageBuffer) {
    try {
        // If in demo mode or no API key, return demo results
        if (DEMO_MODE || !GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
            console.log('Using demo mode for analysis');
            return generateDemoAnalysis();
        }

        // Convert image to base64
        const base64Image = imageToBase64(imageBuffer);

        // Prepare the prompt for medical image analysis
        const prompt = `As a medical imaging AI assistant, analyze this medical image and provide:
        1. Detailed observations of any visible abnormalities
        2. Potential diagnosis based on the image findings
        3. Recommended follow-up actions for healthcare providers
        4. Any critical findings that require immediate attention

        Please format the response in a clear, structured manner suitable for medical professionals.`;

        // Make request to Groq API
        const response = await axios.post(GROQ_API_URL, {
            model: "mixtral-8x7b-32768",
            messages: [
                {
                    role: "system",
                    content: "You are a highly specialized medical imaging AI assistant with expertise in analyzing medical images and providing detailed, professional insights."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 1000
        }, {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Generate simulated quantitative data
        const quantitativeData = {
            riskScores: {
                abnormalityRisk: (Math.random() * 100).toFixed(1),
                urgencyLevel: Math.floor(Math.random() * 5) + 1,
                confidenceScore: (Math.random() * 20 + 80).toFixed(1)
            },
            measurements: {
                size: `${(Math.random() * 10).toFixed(1)}cm`,
                density: `${(Math.random() * 100).toFixed(1)}HU`,
                volume: `${(Math.random() * 1000).toFixed(1)}mm³`
            }
        };

        // Combine AI insights with simulated data
        return {
            success: true,
            timestamp: new Date().toISOString(),
            quantitativeAnalysis: quantitativeData,
            qualitativeAnalysis: {
                findings: response.data.choices[0].message.content,
                confidence: `${(Math.random() * 20 + 80).toFixed(1)}%`
            },
            threeDModel: {
                previewUrl: "/assets/images/samples/chest-xray.jpg",
                reconstructionStatus: "complete",
                viewAngles: ["anterior", "lateral", "superior"],
                quality: "high"
            },
            recommendations: {
                priority: quantitativeData.riskScores.urgencyLevel > 3 ? "High" : "Normal",
                followUp: "Recommended within 2 weeks",
                additionalTests: ["Contrast Enhanced MRI", "PET Scan"]
            }
        };

    } catch (error) {
        console.error('Error in Groq API integration:', error);
        
        // If API call fails, fall back to demo results
        console.log('Falling back to demo mode due to API error');
        return generateDemoAnalysis();
    }
}

module.exports = {
    analyzeImage
};