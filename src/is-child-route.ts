/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

type WithParent = {
  parent?: WithParent | null | undefined;
};

export function isChildRoute(
  parentRoute: WithParent | null,
  childRoute: WithParent | null | undefined,
): boolean {
  if (parentRoute === null) return false;

  let route = childRoute;
  while (route) {
    route = route.parent;
    if (route === parentRoute) {
      return true;
    }
  }

  return false;
}
