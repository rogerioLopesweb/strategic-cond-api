require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

// --- Middlewares Globais ---
app.use(cors());
app.use(express.json());

// --- Configuração do Swagger com Segurança JWT ---
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'StrategicCond API',
            version: '1.0.0',
            description: 'API para gestão de encomendas com IA e autenticação Bearer Token',
        },
        servers: [
            { 
                url: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
                description: 'Servidor Principal'
            }
        ],
        // Definição do esquema de segurança para o Swagger
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Insira o token JWT gerado no login.'
                }
            }
        },
        // Aplica a segurança globalmente em todos os endpoints documentados
        security: [{
            bearerAuth: []
        }]
    },
    apis: ['./src/routes/*.js'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- Rotas da API ---
app.use('/api/auth', authRoutes);

// --- Rota de Teste de Saúde (Health Check) ---
app.get('/', (req, res) => {
    res.json({ success: true, message: 'StrategicCond API Online', version: '1.0.0' });
});

// --- Tratamento de Erro 404 ---
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API rodando em http://localhost:${PORT}`);
    console.log(`📖 Documentação em http://localhost:${PORT}/api-docs`);
});