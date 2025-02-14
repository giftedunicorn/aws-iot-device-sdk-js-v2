/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/*
 * The 'aws-iot-device-sdk-v2' module exports the same set of mqtt/http/io primitives as the crt, but
 * it is not importable from this file based on js module resolution rules (because this file is sitting off
 * in shared la-la-land) which walk up the directory tree from the file itself.
 *
 * So use the aws-crt interfaces directly, but a real application that was rooted in a single place could
 * naturally use something like
 *
 * const iotsdk = require('aws-iot-device-sdk-v2')
 * const auth = iotsdk.auth;
 * etc...
 *
 */
const awscrt = require('aws-crt');
const auth = awscrt.auth;
const http = awscrt.http;
const io = awscrt.io;
const iot = awscrt.iot;
const mqtt = awscrt.mqtt;

/*
 * Arguments that control how the sample should establish its mqtt connection(s).
 * Adds arguments for direct MQTT connections and websocket connections
 */
function add_connection_establishment_arguments(yargs) {
    add_universal_arguments(yargs);
    add_common_mqtt_arguments(yargs);
    add_direct_tls_connect_arguments(yargs);
    add_proxy_arguments(yargs);
    add_common_websocket_arguments(yargs);
}

/*
 * Adds arguments that allow for easy direct MQTT connections.
 */
function add_direct_connection_establishment_arguments(yargs) {
    add_universal_arguments(yargs);
    add_common_mqtt_arguments(yargs);
    add_direct_tls_connect_arguments(yargs);
    add_proxy_arguments(yargs);
}

/*
 * Adds universal arguments every sample should have (help and logging verbosity)
 */
function add_universal_arguments(yargs) {
    yargs
        .option('verbosity', {
            alias: 'v',
            description: 'The amount of detail in the logging output of the sample (optional).',
            type: 'string',
            default: 'none',
            choices: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'none']
        })
        .help()
        .alias('help', 'h')
        .showHelpOnFail(false)
}

/*
 * Common MQTT arguments needed for making a connection
 */
function add_common_mqtt_arguments(yargs) {
    yargs
        .option('endpoint', {
            alias: 'e',
            description: '<path>: Your AWS IoT custom endpoint, not including a port.',
            type: 'string',
            required: true
        })
        .option('ca_file', {
            alias: 'r',
            description: '<path>: File path to a Root CA certificate file in PEM format (optional, system trust store used by default).',
            type: 'string',
            required: false
        })
        .option('client_id', {
            alias: 'C',
            description: 'Client ID for MQTT connection.',
            type: 'string',
            required: false
        })
}

/*
 * Common MQTT arguments needed for making a connection
 */
function add_direct_tls_connect_arguments(yargs, is_required=false) {
    yargs
        .option('cert', {
            alias: 'c',
            description: '<path>: File path to a PEM encoded certificate to use with mTLS.',
            type: 'string',
            required: is_required
        })
        .option('key', {
            alias: 'k',
            description: '<path>: File path to a PEM encoded private key that matches cert.',
            type: 'string',
            required: is_required
        })
}

/*
 * Proxy arguments
 */
function add_proxy_arguments(yargs) {
    yargs
        .option('proxy_host', {
            alias: 'H',
            description: 'Hostname of the proxy to connect to (optional, required if --proxy_port is set).',
            type: 'string',
            required: false
        })
        .option('proxy_port', {
            alias: 'P',
            default: 8080,
            description: 'Port of the proxy to connect to (optional, required if --proxy_host is set).',
            type: 'number',
            required: false
        })
}

/*
 * Common Websocket arguments needed for making a connection
 */
function add_common_websocket_arguments(yargs, is_required=false) {
    yargs
        .option('signing_region', {
            alias: 's',
            description: 'If you specify --signing_region then you will use websockets to connect. This' +
                'is the region that will be used for computing the Sigv4 signature.  This region must match the' +
                'AWS region in your endpoint.',
            type: 'string',
            required: is_required
        })
}

/*
 * Arguments specific to sending a message to a topic multiple times.  We have multiple samples that use these arguments.
 */
function add_topic_message_arguments(yargs) {
    yargs
        .option('topic', {
            alias: 't',
            description: 'Topic to publish to (optional).',
            type: 'string',
            default: 'test/topic'
        })
        .option('count', {
            alias: 'n',
            default: 10,
            description: 'Number of messages to publish/receive before exiting. ' +
                'Specify 0 to run forever (optional).',
            type: 'number',
            required: false
        })
        .option('message', {
            alias: 'M',
            description: 'Message to publish (optional).',
            type: 'string',
            default: 'Hello world!'
        })
}

/*
 * Arguments specific to the shadow style samples.
 */
function add_shadow_arguments(yargs) {
    yargs
        .option('shadow_property', {
            alias: 'p',
            description: 'Name of property in shadow to keep in sync',
            type: 'string',
            default: 'color'
        })
        .option('thing_name', {
            alias: 'n',
            description: 'The name assigned to your IoT Thing',
            type: 'string',
            default: 'name'
        })
}

/*
 * Handles any non-specific arguments that are relevant to all samples
 */
function apply_sample_arguments(argv) {
    if (argv.verbosity != 'none') {
        const level = parseInt(io.LogLevel[argv.verbosity.toUpperCase()]);
        io.enable_logging(level);
    }
}

/*
 * A set of simple connection builder functions intended to cover a variety of scenarios/configurations.
 *
 * There is plenty of redundant code across these functions, but in this case we are trying to show, stand-alone and
 * top-to-bottom, all the steps needed to establish an mqtt connection for each scenario.
 *
 * ToDo : Add a connection builder for custom auth case
 * ToDo : Add a connection builder showing x509 provider usage.  Pre-req: x509 provider binding.
 * ToDo : Add a connection builder for websockets using cognito and the Aws SDK for JS (or implement and bind
 *        a cognito provider).
 */

/*
 * Build an mqtt connection using websockets, (http) proxy optional.
 */
function build_websocket_mqtt_connection_from_args(argv) {
    let config_builder = iot.AwsIotMqttConnectionConfigBuilder.new_with_websockets({
        region: argv.signing_region,
        credentials_provider: auth.AwsCredentialsProvider.newDefault()
    });

    if (argv.proxy_host) {
        config_builder.with_http_proxy_options(new http.HttpProxyOptions(argv.proxy_host, argv.proxy_port));
    }

    if (argv.ca_file != null) {
        config_builder.with_certificate_authority_from_path(undefined, argv.ca_file);
    }

    config_builder.with_clean_session(false);
    config_builder.with_client_id(argv.client_id || "test-" + Math.floor(Math.random() * 100000000));
    config_builder.with_endpoint(argv.endpoint);
    const config = config_builder.build();

    const client = new mqtt.MqttClient();
    return client.new_connection(config);
}

/*
 * Build a direct mqtt connection using mtls, (http) proxy optional
 */
function build_direct_mqtt_connection_from_args(argv) {
    let config_builder = iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(argv.cert, argv.key);

    if (argv.proxy_host) {
        config_builder.with_http_proxy_options(new http.HttpProxyOptions(argv.proxy_host, argv.proxy_port));
    }

    if (argv.ca_file != null) {
        config_builder.with_certificate_authority_from_path(undefined, argv.ca_file);
    }

    config_builder.with_clean_session(false);
    config_builder.with_client_id(argv.client_id || "test-" + Math.floor(Math.random() * 100000000));
    config_builder.with_endpoint(argv.endpoint);
    const config = config_builder.build();

    const client = new mqtt.MqttClient();
    return client.new_connection(config);
}

/*
 * Uses all of the connection-relevant arguments to create an mqtt connection as desired.
 */
function build_connection_from_cli_args(argv) {
    /*
     * Only basic websocket and direct mqtt connections for now.  Later add custom authorizer and x509 support.
     */
    if (argv.signing_region) {
        return build_websocket_mqtt_connection_from_args(argv);
    } else {
        return build_direct_mqtt_connection_from_args(argv);
    }
}

exports.add_connection_establishment_arguments = add_connection_establishment_arguments;
exports.add_direct_connection_establishment_arguments = add_direct_connection_establishment_arguments;
exports.add_universal_arguments = add_universal_arguments;
exports.add_common_mqtt_arguments = add_common_mqtt_arguments;
exports.add_direct_tls_connect_arguments = add_direct_tls_connect_arguments;
exports.add_proxy_arguments = add_proxy_arguments;
exports.add_common_websocket_arguments = add_common_websocket_arguments;
exports.add_topic_message_arguments = add_topic_message_arguments;
exports.add_shadow_arguments = add_shadow_arguments;
exports.apply_sample_arguments = apply_sample_arguments;
exports.build_connection_from_cli_args = build_connection_from_cli_args;
