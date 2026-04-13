import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

type PlaidLinkOpenerProps = {
  token: string | null;
  onPublicToken: (publicToken: string) => void | Promise<void>;
  onClosed: () => void;
};

function parsePlaidRedirect(url: string): { kind: 'connected' | 'exit'; publicToken?: string } | null {
  if (url.startsWith('plaidlink://connected')) {
    const q = url.includes('?') ? url.split('?')[1] : '';
    const params = new URLSearchParams(q);
    return { kind: 'connected', publicToken: params.get('public_token') || undefined };
  }
  if (url.startsWith('plaidlink://exit')) {
    return { kind: 'exit' };
  }
  return null;
}

export function PlaidLinkOpener({ token, onPublicToken, onClosed }: PlaidLinkOpenerProps) {
  const insets = useSafeAreaInsets();
  const handledRef = useRef(false);
  const visible = !!token;
  const uri = token
    ? `https://cdn.plaid.com/link/v2/stable/link.html?isWebView=true&token=${encodeURIComponent(token)}`
    : '';

  useEffect(() => {
    handledRef.current = false;
  }, [token]);

  const handleRedirectUrl = (url: string) => {
    if (!url.startsWith('plaidlink://')) {
      return true;
    }
    const parsed = parsePlaidRedirect(url);
    if (parsed?.kind === 'connected' && parsed.publicToken) {
      if (!handledRef.current) {
        handledRef.current = true;
        Promise.resolve(onPublicToken(parsed.publicToken)).finally(() => onClosed());
      }
      return false;
    }
    if (parsed?.kind === 'exit') {
      if (!handledRef.current) {
        handledRef.current = true;
        onClosed();
      }
      return false;
    }
    return true;
  };

  const handleRequest = (request: { url: string }) => handleRedirectUrl(request.url);

  if (!token) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClosed}>
      <View style={[styles.wrap, { paddingTop: insets.top }]}>
        <View style={styles.toolbar}>
          <TouchableOpacity onPress={onClosed} hitSlop={12} style={styles.closeBtn}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.toolbarTitle}>Link bank</Text>
          <View style={styles.toolbarSpacer} />
        </View>
        <WebView
          source={{ uri }}
          style={styles.webview}
          onShouldStartLoadWithRequest={handleRequest}
          onNavigationStateChange={(nav) => {
            handleRedirectUrl(nav.url);
          }}
          originWhitelist={['https://*', 'plaidlink://*']}
          setSupportMultipleWindows={Platform.OS === 'android'}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    minWidth: 64,
  },
  closeText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  toolbarTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  toolbarSpacer: { width: 64 },
  webview: {
    flex: 1,
  },
});
