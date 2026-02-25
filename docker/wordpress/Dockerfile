FROM wordpress:6.7-php8.1-apache

# System-Abhängigkeiten
RUN apt-get update && apt-get install -y \
    zip \
    unzip \
    less \
    mariadb-client \
    && rm -rf /var/lib/apt/lists/*

# WP-CLI installieren
RUN curl -o /usr/local/bin/wp https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x /usr/local/bin/wp

# Composer installieren
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

# PHP-Konfiguration
COPY php.ini /usr/local/etc/php/conf.d/ism-custom.ini

# Mailpit MU-Plugin (automatische SMTP-Konfiguration)
COPY mu-plugins/resa-mailpit.php /usr/src/wordpress/wp-content/mu-plugins/resa-mailpit.php

# WP-Setup-Script
COPY wp-setup.sh /usr/local/bin/wp-setup.sh
RUN chmod +x /usr/local/bin/wp-setup.sh
