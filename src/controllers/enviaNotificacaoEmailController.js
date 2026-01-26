const nodemailer = require('nodemailer');
const pool = require('../config/db');

// Configuração do transportador Hostinger
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, 
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const processarFilaEmail = async (req, res) => {
    console.log('--- Execução: enviaNotificacaoEmailController iniciada ---');
    let client;

    try {
        client = await pool.connect();

        const query = `
            SELECT n.*, u.nome_completo 
            FROM notificacoes n
            JOIN usuarios u ON n.usuario_id = u.id
            WHERE n.status = 'pendente' 
            AND n.canal = 'email' 
            LIMIT 20`;

        const result = await client.query(query);

        if (result.rows.length === 0) {
            return res.json({ success: true, message: 'Fila de e-mail vazia.' });
        }

        const idsProcessados = [];
        // Pegando a BASE_URL do .env (Ex: https://api.strategicflow.com.br)
        const baseUrl = process.env.BASE_URL;

        for (let row of result.rows) {
            try {
                // CORREÇÃO: Usando a variável BASE_URL para o QR Code
                const qrCodeUrl = `${baseUrl}/api/qrcode/entrega/${row.entrega_id}`;
                const primeiroNome = row.nome_completo ? row.nome_completo.split(' ')[0] : 'Morador';

                await transporter.sendMail({
                    from: `"StrategicCond" <${process.env.SMTP_USER}>`,
                    to: row.destino,
                    subject: row.titulo,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; color: #333; border: 1px solid #eee; padding: 20px; border-radius: 15px;">
                            <h2 style="color: #1a4ab2;">Olá, ${primeiroNome}!</h2>
                            <p style="font-size: 16px;">${row.mensagem}</p>
                            
                            <div style="text-align: center; background: #f4f7ff; padding: 30px; border-radius: 12px; margin: 25px 0; border: 1px dashed #1a4ab2;">
                                <p style="font-weight: bold; color: #1a4ab2; margin-bottom: 15px;">QR CODE PARA RETIRADA RÁPIDA</p>
                                <img src="${qrCodeUrl}" alt="QR Code" width="220" height="220" style="background: white; padding: 10px; border-radius: 5px;" />
                                <p style="font-size: 11px; color: #777; margin-top: 15px;">Código da Entrega: ${row.entrega_id}</p>
                            </div>

                            <p style="font-size: 13px; color: #666;">Basta apresentar este código ao porteiro para liberar sua encomenda.</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                            <p style="font-size: 11px; color: #999; text-align: center;">StrategicFlow - Gestão Inteligente de Condomínios</p>
                        </div>
                    `,
                });

                idsProcessados.push(row.id);
            } catch (mailError) {
                console.error(`Erro ao enviar para ${row.destino}:`, mailError);
                await client.query("UPDATE notificacoes SET status = 'erro', erro_log = $1 WHERE id = $2", [mailError.message, row.id]);
            }
        }

        if (idsProcessados.length > 0) {
            await client.query(
                "UPDATE notificacoes SET status = 'enviado', data_envio = NOW() WHERE id = ANY($1)",
                [idsProcessados]
            );
        }

        res.json({ success: true, total_enviados: idsProcessados.length });

    } catch (error) {
        console.error('Erro no enviaNotificacaoEmailController:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        if (client) client.release();
    }
};

module.exports = { processarFilaEmail };