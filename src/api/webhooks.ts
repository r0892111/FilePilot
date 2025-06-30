// Call this after a successful insert into user_email_accounts
export const triggerCompleteSetupWebhook = async (userId: string, email: string, provider: string, status: string,folder_id:string) => {
    try {
        await fetch("https://alexfinit.app.n8n.cloud/webhook-test/798d561d-ce54-4636-99a6-2b57a4e17eb1", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                event: "setup_complete",
                user_id: userId,
                email,
                provider,
                folder_id,
                status,
                timestamp: new Date().toISOString(),
            }),
        });
    } catch (err) {
        console.error("Webhook failed", err);
    }
  };