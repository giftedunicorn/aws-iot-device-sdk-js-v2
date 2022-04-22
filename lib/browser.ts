/*
 *
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/**
 * Service clients and data models for interacting with AWS Iot services:
 * - Greengrass Discovery
 * - Identity
 * - Jobs
 * - Shadow
 *
 * @packageDocumentation
 * @module aws-iot-device-sdk
 * @preferred
 */

import * as iotidentity from './iotidentity/iotidentityclient';
import * as greengrass from './greengrass/discoveryclient';
import * as iotjobs from './iotjobs/iotjobsclient';
import * as iotshadow from './iotshadow/iotshadowclient';

import { mqtt, http, io, iot } from 'aws-crt/dist.browser/browser';

export {
    iotidentity,
    greengrass,
    iotjobs,
    iotshadow,
    mqtt,
    http,
    io,
    iot
}
