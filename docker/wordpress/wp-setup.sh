#!/bin/bash
set -e

# Warten bis MySQL bereit ist
echo "Warte auf MySQL..."
while ! mysqladmin ping -h"$WORDPRESS_DB_HOST" --silent 2>/dev/null; do
    sleep 2
done
echo "MySQL ist bereit."

# Warten bis WordPress-Dateien vorhanden sind
echo "Warte auf WordPress-Dateien..."
while [ ! -f /var/www/html/wp-includes/version.php ]; do
    sleep 2
done
echo "WordPress-Dateien vorhanden."

# Kurz warten damit WordPress vollständig initialisiert
sleep 5

cd /var/www/html

# MU-Plugin kopieren falls noch nicht vorhanden
if [ ! -f wp-content/mu-plugins/ism-mailpit.php ]; then
    mkdir -p wp-content/mu-plugins
    cp /usr/src/wordpress/wp-content/mu-plugins/ism-mailpit.php wp-content/mu-plugins/
    echo "Mailpit MU-Plugin installiert."
fi

# WordPress installieren falls noch nicht geschehen
if ! wp core is-installed --allow-root 2>/dev/null; then
    echo "Installiere WordPress..."
    wp core install \
        --url="${WP_URL:-http://localhost:8080}" \
        --title="ISM Dev" \
        --admin_user="${WP_ADMIN_USER:-admin}" \
        --admin_password="${WP_ADMIN_PASSWORD:-admin}" \
        --admin_email="${WP_ADMIN_EMAIL:-admin@example.com}" \
        --skip-email \
        --allow-root

    # Deutsche Sprache installieren und aktivieren
    wp language core install de_DE --allow-root
    wp site switch-language de_DE --allow-root

    # Permalink-Struktur setzen
    wp rewrite structure '/%postname%/' --allow-root
    wp rewrite flush --allow-root

    # Plugin aktivieren
    if [ -d wp-content/plugins/immobilien-smart-assets ]; then
        wp plugin activate immobilien-smart-assets --allow-root 2>/dev/null || echo "Plugin konnte nicht aktiviert werden (noch keine Plugin-Hauptdatei?)"
    fi

    # Blogname setzen
    wp option update blogname "ISM Dev" --allow-root

    # Testseite mit Shortcode erstellen
    wp post create \
        --post_type=page \
        --post_title="Smart Asset Test" \
        --post_content='<!-- wp:shortcode -->[ism]<!-- /wp:shortcode -->' \
        --post_status=publish \
        --allow-root

    echo "WordPress-Setup abgeschlossen!"
else
    echo "WordPress ist bereits installiert."
fi
