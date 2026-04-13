import { useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';

type PlaidLinkOpenerProps = {
  token: string | null;
  onPublicToken: (publicToken: string) => void | Promise<void>;
  onClosed: () => void;
};

export function PlaidLinkOpener({ token, onPublicToken, onClosed }: PlaidLinkOpenerProps) {
  const { open, ready } = usePlaidLink({
    token,
    onSuccess: (public_token) => {
      Promise.resolve(onPublicToken(public_token)).finally(() => onClosed());
    },
    onExit: () => onClosed(),
  });

  useEffect(() => {
    if (token && ready) {
      open();
    }
  }, [token, ready, open]);

  return null;
}
