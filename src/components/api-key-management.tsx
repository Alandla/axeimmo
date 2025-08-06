'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from "next-intl"
import { Copy, Key, RotateCcw, Trash2, AlertCircle, Rocket, Check, Eye, EyeOff } from 'lucide-react'
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert"
import { Badge } from "@/src/components/ui/badge"
import { basicApiCall, basicApiGetCall, basicApiDeleteCall } from '../lib/api'
import { useRouter } from 'next/navigation'
import { useActiveSpaceStore } from '../store/activeSpaceStore'
import { PlanName } from '../types/enums'

interface ApiKeyData {
  keyPrefix: string;
  name: string;
  lastUsedAt?: string;
  permissions: string[];
  rateLimitPerMinute: number;
  createdAt: string;
}

export function ApiKeyManagement() {
  const t = useTranslations('settings');
  const router = useRouter();
  const { activeSpace } = useActiveSpaceStore();
  
  const [apiKey, setApiKey] = useState<ApiKeyData | null>(null);
  const [plainKey, setPlainKey] = useState<string>('');
  const [showPlainKey, setShowPlainKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [keyName, setKeyName] = useState('API Key');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>('');
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);

  useEffect(() => {
    if (activeSpace?.id) {
      fetchApiKey();
    }
  }, [activeSpace?.id]);

  const fetchApiKey = async () => {
    if (!activeSpace?.id) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await basicApiGetCall<{data: ApiKeyData | null}>(`/space/${activeSpace.id}/api-key`);
      setApiKey(response.data);
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.requiresUpgrade) {
        setRequiresUpgrade(true);
      } else {
        setError('Failed to load API key');
      }
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!activeSpace?.id) return;
    
    try {
      setActionLoading(true);
      setError('');
      const response = await basicApiCall<{data: {apiKey: ApiKeyData, plainKey: string}}>(`/space/${activeSpace.id}/api-key`, {
        action: 'create',
        name: keyName
      });
      
      setApiKey(response.data.apiKey);
      setPlainKey(response.data.plainKey);
      setShowPlainKey(true);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create API key');
    } finally {
      setActionLoading(false);
    }
  };

  const regenerateApiKey = async () => {
    if (!activeSpace?.id) return;
    
    if (!confirm(t('api-key-regenerate-confirm'))) return;
    
    try {
      setActionLoading(true);
      setError('');
      const response = await basicApiCall<{data: {apiKey: ApiKeyData, plainKey: string}}>(`/space/${activeSpace.id}/api-key`, {
        action: 'regenerate'
      });
      
      setApiKey(response.data.apiKey);
      setPlainKey(response.data.plainKey);
      setShowPlainKey(true);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to regenerate API key');
    } finally {
      setActionLoading(false);
    }
  };

  const revokeApiKey = async () => {
    if (!activeSpace?.id) return;
    
    if (!confirm(t('api-key-revoke-confirm'))) return;
    
    try {
      setActionLoading(true);
      setError('');
      await basicApiDeleteCall(`/space/${activeSpace.id}/api-key`);
      
      setApiKey(null);
      setPlainKey('');
      setShowPlainKey(false);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to revoke API key');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t('api-access')}
          </CardTitle>
          <CardDescription>
            {t('api-access-description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requiresUpgrade) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t('api-access')}
          </CardTitle>
          <CardDescription>
            {t('api-access-description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Rocket className="h-4 w-4" />
            <AlertTitle>{t('enterprise-required')}</AlertTitle>
            <AlertDescription className="mt-2">
              {t('enterprise-required-description')}
            </AlertDescription>
            <Button 
              className="mt-4"
              onClick={() => router.push('/dashboard/pricing')}
            >
              <Rocket className="h-4 w-4 mr-2" />
              {t('upgrade-to-enterprise')}
            </Button>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          {t('api-access')}
        </CardTitle>
        <CardDescription>
          {t('api-access-description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!apiKey ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="keyName">{t('api-key-name')}</Label>
              <Input
                id="keyName"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="API Key"
                className="mt-1"
              />
            </div>
            
            <Button 
              onClick={createApiKey}
              disabled={actionLoading || !keyName.trim()}
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Key className="h-4 w-4 mr-2" />
              )}
              {t('generate-api-key')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Affichage de la clé complète (une seule fois) */}
            {showPlainKey && plainKey && (
              <Alert className="border-green-200 bg-green-50">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">{t('api-key-generated')}</AlertTitle>
                <AlertDescription className="mt-2 text-green-700">
                  {t('api-key-copy-warning')}
                </AlertDescription>
                <div className="mt-3 p-3 bg-white rounded border font-mono text-sm break-all">
                  {plainKey}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(plainKey)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {t('copied')}
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        {t('copy-key')}
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPlainKey(false)}
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    {t('hide-key')}
                  </Button>
                </div>
              </Alert>
            )}

            {/* Informations de la clé */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{apiKey.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {apiKey.keyPrefix}•••••••••••••••••••••••••••••••••••••••••••••••••••••••
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {apiKey.permissions.map((permission) => (
                    <Badge key={permission} variant="secondary" className="text-xs">
                      {permission.replace(':', ':')}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {t('created')}: {formatDate(apiKey.createdAt)}
                </span>
                {apiKey.lastUsedAt && (
                  <span>
                    {t('last-used')}: {formatDate(apiKey.lastUsedAt)}
                  </span>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground">
                {t('rate-limit')}: {apiKey.rateLimitPerMinute} {t('requests-per-minute')}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={regenerateApiKey}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                {t('regenerate')}
              </Button>
              
              <Button
                variant="outline"
                onClick={revokeApiKey}
                disabled={actionLoading}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('revoke')}
              </Button>
            </div>
          </div>
        )}

        {/* Documentation link */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {t('api-documentation-text')}{' '}
            <a 
              href="https://docs.hoox.video" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {t('api-documentation-link')}
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}