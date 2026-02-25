<?php
/**
 * Plugin Name: RESA Mailpit SMTP
 * Description: Leitet alle WordPress-E-Mails an den Mailpit-Container weiter.
 * Version: 1.0.0
 */

add_action('phpmailer_init', function ($phpmailer) {
    $phpmailer->isSMTP();
    $phpmailer->Host     = 'mailpit';
    $phpmailer->Port     = 1025;
    $phpmailer->SMTPAuth = false;
    $phpmailer->SMTPAutoTLS = false;
});
