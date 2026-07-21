// plugins/amplify.client.ts
import { defineNuxtPlugin, useRuntimeConfig } from "#app";
import { Amplify } from "aws-amplify";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { CookieStorage } from "aws-amplify/utils";

export default defineNuxtPlugin(() => {
  const p = useRuntimeConfig().public;
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: p.NUXT_PUBLIC_COGNITO_USER_POOL_ID as string,
        userPoolClientId: p.NUXT_PUBLIC_COGNITO_APP_CLIENT_ID as string,
        loginWith: {
          oauth: {
            domain: p.NUXT_PUBLIC_COGNITO_DOMAIN as string, // e.g. xyz.auth.us-east-2.amazoncognito.com
            scopes: ["openid", "email", "profile"],
            redirectSignIn: [p.NUXT_PUBLIC_REDIRECT_SIGNIN as string],
            redirectSignOut: [p.NUXT_PUBLIC_REDIRECT_SIGNOUT as string],
            responseType: "code",
          },
        },
      },
    },
  });
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    
    const cookieStorageOptions = {
      domain: isLocalhost ? 'localhost' : '.pointtaken.social',
      path: "/",
      sameSite: "lax" as const,
      secure: !isLocalhost,
    };

    cognitoUserPoolsTokenProvider.setKeyValueStorage(
      new CookieStorage(cookieStorageOptions)
    );

});
