/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

function resolveRoute(context, params) {
  if (typeof context.route.action === 'function') {
    return context.route.action(context, params);
  }

  return null;
}

export default resolveRoute;
