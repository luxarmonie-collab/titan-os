import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Configuration Whoop
const WHOOP_CLIENT_ID = '168b9cac-6454-43e8-aa4a-b1a85937b533';
const WHOOP_CLIENT_SECRET = '99a10f9a930c122ff460915082b91a23ad5ab35ad8daca554d233d8077b98962';
const BASE_URL = process.env.RAILWAY_PUBLIC_DOMAIN 
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : 'https://titan-os-production.up.railway.app';
const WHOOP_REDIRECT_URI = `${BASE_URL}/api/whoop/callback`;

// Supabase
const supabase = createClient(
    'https://nzejiljpfdslouvehvin.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZWppbGpwZmRzbG91dmVodmluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk5MzM5MSwiZXhwIjoyMDc5NTY5MzkxfQ.sFJqub-mW1hwCD-23qSCEhvT4YzYmq5onXKrCz-Wpoo'
);

// ========================================
// API ROUTES - Whoop OAuth
// ========================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
});

// Step 1: Initiate OAuth - redirect to Whoop
app.get('/api/whoop/auth', (req, res) => {
    const userId = req.query.user_id || 'default';
    const scopes = 'read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement';
    
    const authUrl = `https://api.prod.whoop.com/oauth/oauth2/auth?` +
        `client_id=${WHOOP_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(WHOOP_REDIRECT_URI)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&state=${userId}`;
    
    console.log('Redirecting to Whoop auth:', authUrl);
    res.redirect(authUrl);
});

// Step 2: OAuth Callback - exchange code for tokens
app.get('/api/whoop/callback', async (req, res) => {
    const { code, state: userId, error: authError } = req.query;
    
    console.log('Callback received:', { code: !!code, userId, error: authError });
    
    if (authError) {
        return res.redirect(`${BASE_URL}?whoop_error=${authError}`);
    }
    
    if (!code) {
        return res.redirect(`${BASE_URL}?whoop_error=no_code`);
    }
    
    try {
        // Exchange code for tokens
        const tokenResponse = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                client_id: WHOOP_CLIENT_ID,
                client_secret: WHOOP_CLIENT_SECRET,
                redirect_uri: WHOOP_REDIRECT_URI,
            }),
        });
        
        const tokens = await tokenResponse.json();
        console.log('Token response:', { success: !!tokens.access_token, error: tokens.error });
        
        if (tokens.error) {
            console.error('Token error:', tokens);
            return res.redirect(`${BASE_URL}?whoop_error=${tokens.error}`);
        }
        
        // Calculate expiration time
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
        
        // Store tokens in Supabase
        const { error } = await supabase
            .from('whoop_tokens')
            .upsert({
                user_id: userId || 'default',
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: expiresAt,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        
        if (error) {
            console.error('Supabase error:', error);
            return res.redirect(`${BASE_URL}?whoop_error=db_error`);
        }
        
        console.log('Whoop connected successfully for user:', userId);
        res.redirect(`${BASE_URL}?whoop_connected=true`);
        
    } catch (error) {
        console.error('OAuth error:', error);
        res.redirect(`${BASE_URL}?whoop_error=server_error`);
    }
});

// Step 3: Check connection status
app.get('/api/whoop/status', async (req, res) => {
    const userId = req.query.user_id || 'default';
    
    try {
        const { data, error } = await supabase
            .from('whoop_tokens')
            .select('expires_at, updated_at')
            .eq('user_id', userId)
            .single();
        
        if (error || !data) {
            return res.json({ connected: false });
        }
        
        res.json({ 
            connected: true, 
            expiresAt: data.expires_at,
            lastUpdated: data.updated_at
        });
    } catch (error) {
        res.json({ connected: false });
    }
});

// Step 4: Get Whoop data
app.get('/api/whoop/data', async (req, res) => {
    const userId = req.query.user_id || 'default';
    
    try {
        // Get tokens from Supabase
        const { data: tokenData, error: tokenError } = await supabase
            .from('whoop_tokens')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (tokenError || !tokenData) {
            return res.status(401).json({ error: 'Not connected to Whoop', connected: false });
        }
        
        // Check if token expired and refresh if needed
        let accessToken = tokenData.access_token;
        if (new Date(tokenData.expires_at) < new Date()) {
            console.log('Token expired, refreshing...');
            
            const refreshResponse = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: tokenData.refresh_token,
                    client_id: WHOOP_CLIENT_ID,
                    client_secret: WHOOP_CLIENT_SECRET,
                }),
            });
            
            const newTokens = await refreshResponse.json();
            
            if (newTokens.error) {
                console.error('Refresh failed:', newTokens);
                // Delete invalid tokens
                await supabase.from('whoop_tokens').delete().eq('user_id', userId);
                return res.status(401).json({ error: 'Token refresh failed', connected: false });
            }
            
            accessToken = newTokens.access_token;
            
            // Update tokens in DB
            await supabase.from('whoop_tokens').update({
                access_token: newTokens.access_token,
                refresh_token: newTokens.refresh_token,
                expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
                updated_at: new Date().toISOString()
            }).eq('user_id', userId);
            
            console.log('Token refreshed successfully');
        }
        
        // Fetch all Whoop data in parallel
        const headers = { 'Authorization': `Bearer ${accessToken}` };
        
        const [recoveryRes, cycleRes, sleepRes, profileRes] = await Promise.all([
            fetch('https://api.prod.whoop.com/developer/v1/recovery?limit=1', { headers }),
            fetch('https://api.prod.whoop.com/developer/v1/cycle?limit=1', { headers }),
            fetch('https://api.prod.whoop.com/developer/v1/activity/sleep?limit=1', { headers }),
            fetch('https://api.prod.whoop.com/developer/v1/user/profile/basic', { headers }),
        ]);
        
        const [recovery, cycle, sleep, profile] = await Promise.all([
            recoveryRes.json(),
            cycleRes.json(),
            sleepRes.json(),
            profileRes.json(),
        ]);
        
        // Format response
        const latestRecovery = recovery.records?.[0];
        const latestCycle = cycle.records?.[0];
        const latestSleep = sleep.records?.[0];
        
        const responseData = {
            connected: true,
            profile: {
                firstName: profile.first_name,
                lastName: profile.last_name,
                email: profile.email,
            },
            recovery: latestRecovery ? {
                score: latestRecovery.score?.recovery_score,
                hrv: latestRecovery.score?.hrv_rmssd_milli ? Math.round(latestRecovery.score.hrv_rmssd_milli) : null,
                rhr: latestRecovery.score?.resting_heart_rate,
                date: latestRecovery.created_at,
            } : null,
            strain: latestCycle ? {
                score: latestCycle.score?.strain ? Math.round(latestCycle.score.strain * 10) / 10 : null,
                calories: latestCycle.score?.kilojoule ? Math.round(latestCycle.score.kilojoule * 0.239) : null,
                avgHr: latestCycle.score?.average_heart_rate,
                maxHr: latestCycle.score?.max_heart_rate,
                date: latestCycle.created_at,
            } : null,
            sleep: latestSleep ? {
                score: latestSleep.score?.sleep_performance_percentage,
                duration: latestSleep.score?.stage_summary?.total_in_bed_time_milli ? 
                    Math.round(latestSleep.score.stage_summary.total_in_bed_time_milli / 3600000 * 10) / 10 : null,
                efficiency: latestSleep.score?.sleep_efficiency_percentage,
                rem: latestSleep.score?.stage_summary?.rem_sleep_time_milli ?
                    Math.round(latestSleep.score.stage_summary.rem_sleep_time_milli / 60000) : null,
                deep: latestSleep.score?.stage_summary?.slow_wave_sleep_time_milli ?
                    Math.round(latestSleep.score.stage_summary.slow_wave_sleep_time_milli / 60000) : null,
                date: latestSleep.created_at,
            } : null,
            lastUpdated: new Date().toISOString(),
        };
        
        console.log('Whoop data fetched successfully');
        res.json(responseData);
        
    } catch (error) {
        console.error('Data fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch Whoop data', connected: true });
    }
});

// Disconnect Whoop
app.post('/api/whoop/disconnect', async (req, res) => {
    const userId = req.body.user_id || req.query.user_id || 'default';
    
    await supabase.from('whoop_tokens').delete().eq('user_id', userId);
    console.log('Whoop disconnected for user:', userId);
    
    res.json({ success: true });
});

// ========================================
// BRIDGE API - Agrégation bancaire
// ========================================

const BRIDGE_CLIENT_ID = 'sandbox_id_ea7a48de3e014f158bc4e1c15ffe9f65';
const BRIDGE_CLIENT_SECRET = 'sandbox_secret_EcbBoJdxiXOKE2tExmrqNcHIdMdto3r5J514sTt3mHsVdwAYARnBZiCQKYQKjH6v';
const BRIDGE_API_URL = 'https://api.sandbox.bridgeapi.io';

// Helper: Get Bridge access token
async function getBridgeAccessToken() {
    const response = await fetch(`${BRIDGE_API_URL}/v2/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: BRIDGE_CLIENT_ID,
            client_secret: BRIDGE_CLIENT_SECRET
        })
    });
    const data = await response.json();
    return data.access_token;
}

// Step 1: Create Bridge user and get connect URL
app.get('/api/bridge/connect', async (req, res) => {
    const userId = req.query.user_id || 'default';
    
    try {
        // Get Bridge access token
        const accessToken = await getBridgeAccessToken();
        console.log('Bridge access token obtained');
        
        // Check if user already exists
        const { data: existing } = await supabase
            .from('bridge_connections')
            .select('bridge_user_uuid')
            .eq('user_id', userId)
            .single();
        
        let bridgeUserUuid = existing?.bridge_user_uuid;
        
        // Create Bridge user if doesn't exist
        if (!bridgeUserUuid) {
            const userResponse = await fetch(`${BRIDGE_API_URL}/v2/users`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Bridge-Version': '2021-06-01'
                },
                body: JSON.stringify({
                    external_user_id: userId
                })
            });
            
            const userData = await userResponse.json();
            console.log('Bridge user created:', userData);
            
            if (userData.uuid) {
                bridgeUserUuid = userData.uuid;
                
                // Save to Supabase
                await supabase.from('bridge_connections').upsert({
                    user_id: userId,
                    bridge_user_uuid: bridgeUserUuid,
                    updated_at: new Date().toISOString()
                });
            } else {
                throw new Error('Failed to create Bridge user');
            }
        }
        
        // Generate connect URL
        const connectResponse = await fetch(`${BRIDGE_API_URL}/v2/connect/items/add/url`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Bridge-Version': '2021-06-01'
            },
            body: JSON.stringify({
                user_uuid: bridgeUserUuid,
                prefill_email: `${userId}@titan-os.app`,
                redirect_url: `${BASE_URL}/api/bridge/callback?user_id=${userId}`
            })
        });
        
        const connectData = await connectResponse.json();
        console.log('Bridge connect URL:', connectData);
        
        if (connectData.redirect_url) {
            res.redirect(connectData.redirect_url);
        } else {
            res.redirect(`${BASE_URL}?bridge_error=connect_failed`);
        }
        
    } catch (error) {
        console.error('Bridge connect error:', error);
        res.redirect(`${BASE_URL}?bridge_error=server_error`);
    }
});

// Step 2: Bridge callback after bank connection
app.get('/api/bridge/callback', async (req, res) => {
    const { user_id: userId, item_id: itemId, error } = req.query;
    
    console.log('Bridge callback:', { userId, itemId, error });
    
    if (error) {
        return res.redirect(`${BASE_URL}?bridge_error=${error}`);
    }
    
    if (itemId) {
        // Update connection with item_id
        await supabase.from('bridge_connections').update({
            access_token: itemId,
            updated_at: new Date().toISOString()
        }).eq('user_id', userId);
    }
    
    res.redirect(`${BASE_URL}?bridge_connected=true`);
});

// Step 3: Check connection status
app.get('/api/bridge/status', async (req, res) => {
    const userId = req.query.user_id || 'default';
    
    try {
        const { data, error } = await supabase
            .from('bridge_connections')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (error || !data || !data.access_token) {
            return res.json({ connected: false });
        }
        
        res.json({ 
            connected: true,
            lastUpdated: data.updated_at
        });
    } catch (error) {
        res.json({ connected: false });
    }
});

// Step 4: Get accounts
app.get('/api/bridge/accounts', async (req, res) => {
    const userId = req.query.user_id || 'default';
    
    try {
        const { data: connection } = await supabase
            .from('bridge_connections')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (!connection?.bridge_user_uuid) {
            return res.status(401).json({ error: 'Not connected', connected: false });
        }
        
        const accessToken = await getBridgeAccessToken();
        
        // Get accounts
        const accountsResponse = await fetch(`${BRIDGE_API_URL}/v2/accounts?user_uuid=${connection.bridge_user_uuid}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Bridge-Version': '2021-06-01'
            }
        });
        
        const accountsData = await accountsResponse.json();
        console.log('Bridge accounts:', accountsData);
        
        const accounts = (accountsData.resources || []).map(acc => ({
            id: acc.id,
            name: acc.name,
            balance: acc.balance,
            currency: acc.currency_code,
            type: acc.type,
            bankName: acc.bank?.name || 'Banque'
        }));
        
        res.json({ connected: true, accounts });
        
    } catch (error) {
        console.error('Bridge accounts error:', error);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

// Step 5: Get transactions
app.get('/api/bridge/transactions', async (req, res) => {
    const userId = req.query.user_id || 'default';
    const limit = parseInt(req.query.limit) || 50;
    
    try {
        const { data: connection } = await supabase
            .from('bridge_connections')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (!connection?.bridge_user_uuid) {
            return res.status(401).json({ error: 'Not connected', connected: false });
        }
        
        const accessToken = await getBridgeAccessToken();
        
        // Get transactions
        const txResponse = await fetch(
            `${BRIDGE_API_URL}/v2/transactions?user_uuid=${connection.bridge_user_uuid}&limit=${limit}`, 
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Bridge-Version': '2021-06-01'
                }
            }
        );
        
        const txData = await txResponse.json();
        console.log('Bridge transactions count:', txData.resources?.length);
        
        const transactions = (txData.resources || []).map(tx => ({
            id: tx.id,
            amount: tx.amount,
            currency: tx.currency_code,
            description: tx.clean_description || tx.raw_description,
            category: tx.category?.name || 'Autre',
            categoryId: tx.category?.id,
            date: tx.date,
            accountId: tx.account_id
        }));
        
        res.json({ connected: true, transactions });
        
    } catch (error) {
        console.error('Bridge transactions error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Disconnect Bridge
app.post('/api/bridge/disconnect', async (req, res) => {
    const userId = req.body.user_id || req.query.user_id || 'default';
    
    await supabase.from('bridge_connections').delete().eq('user_id', userId);
    await supabase.from('bank_transactions').delete().eq('user_id', userId);
    console.log('Bridge disconnected for user:', userId);
    
    res.json({ success: true });
});

// ========================================
// STATIC FILES - Serve React App
// ========================================

// Serve static files from the dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// All other routes serve the React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 4173;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TITAN.OS Server running on port ${PORT}`);
    console.log(`📍 Base URL: ${BASE_URL}`);
});
