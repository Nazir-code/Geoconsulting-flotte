# 🚀 QUICK START - CLOUDFLARE TUNNEL DEPLOYMENT

**Copy-paste commands to deploy your app in ~5 minutes**

---

## PHASE 1: Cloudflare Authentication & Tunnel Creation

```powershell
# Step 1: Authenticate (opens browser)
cloudflared login

# Step 2: Create tunnel
cloudflared tunnel create fleet-app
# IMPORTANT: Note the tunnel URL shown in output
# Example: https://fleet-app-abc123xyz.trycloudflare.com
```

---

## PHASE 2: Update Configuration Files

### Update Backend Environment
```powershell
# Replace YOUR_TUNNEL_URL with actual URL from Step 2 above
$BackendEnvPath = "c:\Users\zabei\OneDrive\Desktop\NOVATECH\ApplicationFlotteVehicule-main\Flotte de vehicule\backend\.env"

@"
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://YOUR_TUNNEL_URL
SOCKET_SECURE=true
"@ | Set-Content $BackendEnvPath

Write-Host "✅ Backend .env updated"
```

### Create Frontend Production Environment
```powershell
# Replace YOUR_TUNNEL_URL with actual URL from Step 2 above
$FrontendProdPath = "c:\Users\zabei\OneDrive\Desktop\NOVATECH\ApplicationFlotteVehicule-main\Flotte de vehicule\.env.production"

@"
VITE_API_URL=https://YOUR_TUNNEL_URL/api
VITE_SOCKET_URL=https://YOUR_TUNNEL_URL
"@ | Set-Content $FrontendProdPath

Write-Host "✅ Frontend .env.production created"
```

---

## PHASE 3: Start All Services (Use 3 PowerShell Terminals)

### Terminal 1: Backend Server
```powershell
cd "c:\Users\zabei\OneDrive\Desktop\NOVATECH\ApplicationFlotteVehicule-main\Flotte de vehicule\backend"
npm start
```
**Expected Output**:
```
🚀 Serveur backend en écoute sur le port 3000
```

### Terminal 2: Cloudflare Tunnel
```powershell
cloudflared tunnel run fleet-app
```
**Expected Output**:
```
INFO Tunnel running. URL: https://fleet-app-abc123xyz.trycloudflare.com
```

### Terminal 3: Frontend Dev Server
```powershell
cd "c:\Users\zabei\OneDrive\Desktop\NOVATECH\ApplicationFlotteVehicule-main\Flotte de vehicule"
npm run dev
```
**Expected Output**:
```
VITE v8.0.4 ready in XXX ms
➜ Local: http://localhost:5173/
```

---

## PHASE 4: Test Your Deployment

### Test #1: Local Browser (Same Machine)
```
1. Open: http://localhost:5173/
2. Login: driver1@fleetnexus.ng / driver123
3. Verify: GPS positions update every 3 seconds
```

### Test #2: Tunnel URL (Any Device on Internet)
```
1. Open: https://YOUR_TUNNEL_URL (replace with actual)
2. Login: driver1@fleetnexus.ng / driver123
3. Verify: GPS positions update every 3 seconds
4. Check: Browser DevTools > Network > WS for WebSocket
```

### Test #3: Tablet (Most Important!)
```
1. Connect tablet to WiFi (same or different network)
2. Open: https://YOUR_TUNNEL_URL
3. Grant geolocation permission when prompted
4. Login: driver1@fleetnexus.ng / driver123
5. Verify:
   - GPS updates every 3 seconds
   - No WebSocket errors in console
   - Positions show on map
```

---

## ⏸️ Stopping Services

```powershell
# Terminal 1: Ctrl+C to stop backend
# Terminal 2: Ctrl+C to stop tunnel
# Terminal 3: Ctrl+C to stop frontend
```

---

## 🔄 Restarting Services (After Changes)

```powershell
# If you change backend .env, restart Terminal 1
# If you change frontend .env.production, restart Terminal 3
# Tunnel (Terminal 2) doesn't need restart

# To restart from scratch:
# 1. Ctrl+C all 3 terminals
# 2. Rerun all 3 commands above
```

---

## 🐛 Troubleshooting

### WebSocket Connection Failed
```powershell
# Check backend is running
curl http://localhost:3000/api/status

# Check tunnel is running
curl https://YOUR_TUNNEL_URL/api/status

# Check environment variables
cd backend
cat .env

# If changed, restart backend server (Terminal 1)
```

### Port 3000 Already in Use
```powershell
# Kill existing process
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess -Force
```

### CORS Error
```
Error: Access denied by CORS policy
```
**Solution**: Verify `ALLOWED_ORIGINS` in `backend/.env` matches your tunnel URL

### Tunnel Won't Connect
```powershell
# Re-authenticate
cloudflared login

# Delete and recreate tunnel
cloudflared tunnel delete fleet-app
cloudflared tunnel create fleet-app
```

---

## 📱 Credentials for Testing

**Dispatch (Manager)**:
- Email: `manager@fleetnexus.ng`
- Password: `manager123`

**Driver #1**:
- Email: `driver1@fleetnexus.ng`
- Password: `driver123`

**Driver #2**:
- Email: `driver2@fleetnexus.ng`
- Password: `driver123`

---

## 📊 Monitoring

### Check Backend Health
```powershell
# Every 5 seconds
while ($true) { 
  Invoke-WebRequest http://localhost:3000/api/status -UseBasicParsing | Select-Object -ExpandProperty Content
  Start-Sleep -Seconds 5 
}
```

### Check Tunnel Status
```powershell
# In tunnel terminal, watch the logs
# You'll see: INFO [tunnel-id] connection ID created
```

### Check Frontend Logs
```powershell
# In frontend terminal, you'll see Vite build messages
# Open browser DevTools (F12) to see React console
```

---

## 🎉 Success Indicators

✅ **Backend Running**:
```
🚀 Serveur backend en écoute sur le port 3000
```

✅ **Tunnel Connected**:
```
INFO Tunnel running. URL: https://fleet-app-abc123xyz.trycloudflare.com
```

✅ **Frontend Ready**:
```
VITE v8.0.4 ready in XXX ms
```

✅ **App Responsive**:
- GPS positions update every 3 seconds
- No console errors
- WebSocket connection shows in DevTools
- Geolocation permission granted on tablet

---

## ⏱️ Timing

- Phase 1 (Auth + Tunnel): **2-3 minutes**
- Phase 2 (Update Config): **1 minute**
- Phase 3 (Start Services): **1 minute**
- Phase 4 (Testing): **5 minutes**

**Total Time to Production**: **~10 minutes** 🚀

---

**Your app is now READY for production deployment!**
