/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { Params, ResultReturn, RouteContext } from './types';

export function resolveRoute<Context extends object, Result>(
  context: RouteContext<Context, Result>,
  params: Params,
): ResultReturn<Result> {
  if (typeof context.route.action === 'function') {
    return context.route.action(context, params);
  }

  return undefined;
}
