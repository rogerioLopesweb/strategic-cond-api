require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // CORREÇÃO: Necessário para o express.static e path.join
const fs = require('fs');     // ADICIONADO: Para garantir que a pasta de fotos exista

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Importação das Rotas
const condominioRoutes = require('./src/routes/condominioRoutes');
const authRoutes = require('./src/routes/authRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');
const entregaRoutes = require('./src/routes/entregaRoutes');
const unidadeRoutes = require('./src/routes/unidadeRoutes');
const testRoutes = require('./src/routes/testRoutes');
const enviaNotificacaoPushRoutes = require('./src/routes/enviaNotificacaoPushRoutes');
const enviaNotificacaoEmailRoutes = require('./src/routes/enviaNotificacaoEmailRoutes');
const qrCodeRoutes = require('./src/routes/qrCodeRoutes');

const app = express();

// --- Garantir existência da pasta de Uploads (Essencial para Volumes Docker) ---
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`📁 Pasta criada: ${uploadDir}`);
}

// --- Middlewares Globais ---
app.use(cors());

/** * Ajuste de Limite para Fotos Base64
 */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Configuração do Swagger ---
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'StrategicCond API',
            version: '1.0.0',
            description: 'API para gestão de encomendas com armazenamento local na VPS',
        },
        servers: [
            { 
                url: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
                description: 'Servidor Principal'
            }
        ],
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
        security: [{ bearerAuth: [] }]
    },
    apis: ['./src/routes/*.js'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- Rotas de Arquivos Estáticos ---
// Permite acessar as fotos via: https://sua-api.com/uploads/nome-da-foto.jpg
app.use('/uploads', express.static(uploadDir));

// --- Rotas da API ---
app.use('/api/condominio', condominioRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/entregas', entregaRoutes);
app.use('/api/unidades', unidadeRoutes);
app.use('/api/testes', testRoutes);
app.use('/api/notificacoes', enviaNotificacaoPushRoutes);
app.use('/api/notificacoes-email', enviaNotificacaoEmailRoutes);
app.use('/api/qrcode', qrCodeRoutes);

// --- Rota de Teste de Saúde (Health Check) ---
app.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: 'StrategicCond API Online (Local Storage)', 
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// --- Tratamento de Erro 404 ---
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API rodando na porta ${PORT}`);
    console.log(`📖 Documentação em /api-docs`);
    console.log(`📸 Servindo arquivos de: ${uploadDir}`);
});