const { Expo } = require('expo-server-sdk');
const pool = require('../config/db');

const expo = new Expo();

const processarFilaPush = async (req, res) => {
    console.log('--- Execução: enviaNotificacaoPushController iniciada ---');
    let client;

    try {
        client = await pool.connect();

        // 1. Busca notificações pendentes e o token do usuário
        // Usamos JOIN para garantir que só pegamos notificações de usuários que têm token
        const query = `
            SELECT n.*, u.expo_push_token 
            FROM notificacoes n
            JOIN usuarios u ON n.usuario_id = u.id
            WHERE n.status = 'pendente' 
            AND n.canal = 'push' 
            AND u.expo_push_token IS NOT NULL
            LIMIT 100`;

        const result = await client.query(query);

        if (result.rows.length === 0) {
            return res.json({ 
                success: true, 
                message: 'Fila vazia. Nenhuma notificação para enviar.' 
            });
        }

        let messages = [];
        const idsProcessados = [];

        for (let row of result.rows) {
            // Validação de segurança do token Expo
            if (!Expo.isExpoPushToken(row.expo_push_token)) {
                await client.query(
                    "UPDATE notificacoes SET status = 'erro', erro_log = 'Token inválido' WHERE id = $1", 
                    [row.id]
                );
                continue;
            }

            // Monta o objeto da mensagem
            messages.push({
                to: row.expo_push_token,
                sound: 'default',
                title: row.titulo,
                body: row.mensagem,
                data: { entrega_id: row.entrega_id },
                priority: 'high',
                // 🚀 ADICIONE ESTE BLOCO ABAIXO:
                android: {
                    channelId: 'entregas', // Exatamente o nome que está no seu NotificationService.js
                },
            });
            idsProcessados.push(row.id);
        }

        // 2. Envio em lotes (chunks) para a API da Expo
        let chunks = expo.chunkPushNotifications(messages);
        for (let chunk of chunks) {
            await expo.sendPushNotificationsAsync(chunk);
        }

        // 3. Atualiza o status para 'enviado' após o sucesso
        await client.query(
            "UPDATE notificacoes SET status = 'enviado', data_envio = NOW() WHERE id = ANY($1)",
            [idsProcessados]
        );

        console.log(`✅ Sucesso: ${idsProcessados.length} notificações enviadas.`);

        res.json({ 
            success: true, 
            total_enviados: idsProcessados.length,
            message: 'Processamento concluído com sucesso.' 
        });

    } catch (error) {
        console.error('❌ Erro no enviaNotificacaoPushController:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao processar fila de notificações.',
            error: error.message 
        });
    } finally {
        if (client) client.release();
    }
};

module.exports = { processarFilaPush };