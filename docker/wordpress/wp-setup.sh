#!/bin/bash
set -e

echo "=== RESA WordPress Setup ==="

# MySQL warten
echo "Warte auf MySQL..."
until mysqladmin ping -h"$WORDPRESS_DB_HOST" --silent 2>/dev/null; do
    sleep 2
done
echo "MySQL bereit."

# WordPress-Dateien warten
echo "Warte auf WordPress-Dateien..."
until [ -f /var/www/html/wp-includes/version.php ]; do
    sleep 2
done
echo "WordPress-Dateien vorhanden."

# WordPress-Init abwarten
sleep 5

cd /var/www/html

# MU-Plugin kopieren
if [ ! -f wp-content/mu-plugins/resa-mailpit.php ]; then
    mkdir -p wp-content/mu-plugins
    cp /usr/src/wordpress/wp-content/mu-plugins/resa-mailpit.php wp-content/mu-plugins/
    echo "Mailpit MU-Plugin installiert."
fi

# WordPress installieren
if ! wp core is-installed --allow-root 2>/dev/null; then
    echo "Installiere WordPress..."
    wp core install \
        --url="${WP_URL:-http://localhost:8080}" \
        --title="RESA Dev" \
        --admin_user="${WP_ADMIN_USER:-admin}" \
        --admin_password="${WP_ADMIN_PASSWORD:-admin}" \
        --admin_email="${WP_ADMIN_EMAIL:-admin@example.com}" \
        --skip-email \
        --allow-root

    # Deutsch
    wp language core install de_DE --allow-root
    wp site switch-language de_DE --allow-root

    # Permalinks
    wp rewrite structure '/%postname%/' --allow-root
    wp rewrite flush --allow-root

    # RESA-Plugin aktivieren
    if [ -d wp-content/plugins/resa ]; then
        wp plugin activate resa --allow-root 2>/dev/null \
            || echo "Plugin konnte nicht aktiviert werden (noch keine Plugin-Hauptdatei?)"
    fi

    # Blogname
    wp option update blogname "RESA Dev" --allow-root

    # Testseite mit Shortcode
    wp post create \
        --post_type=page \
        --post_title="Smart Asset Test" \
        --post_content='<!-- wp:shortcode -->[resa]<!-- /wp:shortcode -->' \
        --post_status=publish \
        --allow-root

    echo "=== WordPress-Setup abgeschlossen! ==="
else
    echo "WordPress ist bereits installiert."
fi
