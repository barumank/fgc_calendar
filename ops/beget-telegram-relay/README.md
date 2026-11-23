# Beget Telegram relay

This small PHP endpoint lets the FightNexus app send Telegram Bot API requests
through a Beget virtual-hosting account. The calendar itself remains on
Timeweb. The endpoint is intentionally limited to `sendMessage` and
`setWebhook`; it is not a general-purpose proxy.

## Beget setup

1. Create a separate site/subdomain such as `relay.fgc-calendar.ru` in Beget.
   Keep `fgc-calendar.ru` and `www.fgc-calendar.ru` pointed at the Timeweb VPS.
2. Add an A record for `relay.fgc-calendar.ru` pointing to the Beget hosting IP.
3. Enable HTTPS for that subdomain in Beget and wait until it is active.
4. Upload `telegram-relay.php` into that site's `public_html` directory.
5. Create `telegram-relay-config.php` one directory above `public_html` using
   `telegram-relay-config.example.php` as a template. Set `shared_secret` to a
   long random value. Do not put this config file inside `public_html` and do
   not commit the real secret.
6. Confirm the selected PHP version has the cURL extension enabled.

The endpoint URL will be:

```text
https://relay.fgc-calendar.ru/telegram-relay.php
```

## Timeweb app setup

Add the same relay URL and shared secret to `/etc/fightnexus/app.env`:

```text
TELEGRAM_RELAY_URL=https://relay.fgc-calendar.ru/telegram-relay.php
TELEGRAM_RELAY_SECRET=the_same_random_value
```

Then restart the app service:

```bash
systemctl restart fightnexus
systemctl is-active fightnexus
```

Afterward, save each bot's settings in the admin panel again to register its
webhook. The webhook callbacks still point directly to the HTTPS calendar on
Timeweb. A Bot API token is sent only from the app to this endpoint over HTTPS;
the endpoint forwards it to Telegram over HTTPS. Never expose the relay secret
or bot tokens in browser code or public files.
