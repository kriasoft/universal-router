/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { PathFunctionOptions, TokensToFunctionOptions, ParseOptions } from 'path-to-regexp'
import UniversalRouter from './UniversalRouter'
import UniversalRouterSync from './UniversalRouterSync'

export interface Params {
  [paramName: string]: any
}

export interface GenerateUrlsOptions
  extends PathFunctionOptions,
    TokensToFunctionOptions,
    ParseOptions {
  stringifyQueryParams?: (params: Params) => string
}

export default function generateUrls(
  router: UniversalRouter | UniversalRouterSync,
  options?: GenerateUrlsOptions,
): (routeName: string, params?: Params) => string
