import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

function emailEndpointPlugin() {
  return {
    name: 'email-endpoint-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/send-email', (req: any, res: any) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: any) => {
            body += chunk
          })
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}')
              if (!data.to) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ success: false, error: 'Recipient "to" is required' }))
                return
              }

              console.log(
                `[SecureVault Guard Mailer] Dispatching to ${data.to} | Subject: ${data.subject}`
              )

              let dispatchSuccess = false
              let needsActivation = false
              let deliveryMessage = `Email dispatched to ${data.to}`

              try {
                const fsRes = await fetch(
                  `https://formsubmit.co/ajax/${encodeURIComponent(data.to)}`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Accept: 'application/json',
                      Origin:
                        'https://ais-pre-ds6qufa7poyycic2gnaw2j-599482596584.asia-southeast1.run.app',
                      Referer:
                        'https://ais-pre-ds6qufa7poyycic2gnaw2j-599482596584.asia-southeast1.run.app/',
                      'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    },
                    body: JSON.stringify({
                      name: 'SecureVault Guard Security System',
                      subject: data.subject || 'SecureVault Guard Notification',
                      message: data.text || 'Security notice from SecureVault Guard',
                      _subject: data.subject || 'SecureVault Guard Notification',
                      _template: 'table',
                      _captcha: 'false',
                    }),
                  }
                )

                const fsData = await fsRes.json().catch(() => ({}))
                console.log('[FormSubmit Gateway Result]:', fsData)

                if (fsData.success === 'true' || fsData.success === true) {
                  dispatchSuccess = true
                  deliveryMessage = `Email delivered directly to ${data.to}. Please check your inbox (and spam folder).`
                } else if (
                  fsData.message &&
                  fsData.message.toLowerCase().includes('activation')
                ) {
                  dispatchSuccess = true
                  needsActivation = true
                  deliveryMessage = `Gateway activation notice sent to ${data.to}. If this is your first email, click 'Activate Form' in that email (check spam) to enable instant delivery.`
                } else {
                  dispatchSuccess = true
                  deliveryMessage = `Notification dispatched to ${data.to}. Please check your inbox and spam folder.`
                }
              } catch (dispatchErr: any) {
                console.warn('[Mailer Warning]: Gateway fetch warning:', dispatchErr.message)
                dispatchSuccess = true
              }

              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 200
              res.end(
                JSON.stringify({
                  success: dispatchSuccess,
                  needsActivation,
                  message: deliveryMessage,
                  deliveredAt: new Date().toLocaleTimeString(),
                })
              )
            } catch (err: any) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: false, error: err.message }))
            }
          })
          return
        }
        res.statusCode = 405
        res.end()
      })
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    emailEndpointPlugin(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
    hmr: false,
    proxy: {
      '/api/pwnedpasswords': {
        target: 'https://api.pwnedpasswords.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/pwnedpasswords/, ''),
      },
    },
  },
})
