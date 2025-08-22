'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from "next-intl"
import { Copy, Key, RotateCcw, Trash2, AlertCircle, Rocket, Check, Eye, EyeOff, Save, Loader2, BookOpen, ExternalLink } from 'lucide-react'
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert"
import { Badge } from "@/src/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Skeleton } from "@/src/components/ui/skeleton"
import { basicApiCall, basicApiGetCall, basicApiDeleteCall } from '../lib/api'
import { useRouter } from 'next/navigation'
import { useActiveSpaceStore } from '../store/activeSpaceStore'
import { PlanName } from '../types/enums'
import { useBrowserDetection } from '../hooks/use-browser-detection'

interface ApiKeyData {
  id?: string;
  keyPrefix: string;
  name: string;
  lastUsedAt?: string;
  permissions: string[];
  rateLimitPerMinute: number;
  createdAt: string;
}

interface ApiKeyManagementProps {
  onClose?: () => void
}

export function ApiKeyManagement({ onClose }: ApiKeyManagementProps = {}) {
  const t = useTranslations('settings.api');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { activeSpace } = useActiveSpaceStore();
  const { isMobile } = useBrowserDetection();
  
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [plainKey, setPlainKey] = useState<string>('');
  const [showPlainKey, setShowPlainKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [keyName, setKeyName] = useState('Production');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>('');
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  const [regeneratingKeyId, setRegeneratingKeyId] = useState<string | null>(null);

  const hasRequiredPlan = activeSpace?.planName === PlanName.ENTREPRISE;
  
  // Nombre d'astérisques selon la plateforme
  const getKeyMask = (keyPrefix: string) => {
    const asterisks = isMobile ? '••••••••••••••' : '••••••••••••••••••••••••••••••';
    return `${keyPrefix}${asterisks}`;
  };

  useEffect(() => {
    if (activeSpace?.id) {
      fetchApiKeys();
    }
  }, [activeSpace?.id]);

  const fetchApiKeys = async () => {
    if (!activeSpace?.id) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await basicApiGetCall<ApiKeyData[]>(`/space/${activeSpace.id}/api-key`);
      setApiKeys(response || []);
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.requiresUpgrade) {
        setRequiresUpgrade(true);
      } else {
        setError('Failed to load API keys');
      }
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!activeSpace?.id) return;
    
    // Check if user has required plan before allowing creation
    if (!hasRequiredPlan) {
      return;
    }
    
    try {
      setActionLoading(true);
      setError('');
      const response = await basicApiCall<{apiKey: ApiKeyData, plainKey: string}>(`/space/${activeSpace.id}/api-key`, {
        action: 'create',
        name: keyName
      });
      
      setApiKeys(prev => [...prev, response.apiKey]);
      setPlainKey(response.plainKey);
      setShowPlainKey(true);
      setKeyName('API Key');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create API key');
    } finally {
      setActionLoading(false);
    }
  };

  const regenerateApiKey = async (keyId: string) => {
    if (!activeSpace?.id) return;
    
    // Check if user has required plan before allowing regeneration
    if (!hasRequiredPlan) {
      return;
    }
    
    if (!confirm(t('regenerate-confirm'))) return;
    
    try {
      setRegeneratingKeyId(keyId);
      setError('');
      const response = await basicApiCall<{apiKey: ApiKeyData, plainKey: string}>(`/space/${activeSpace.id}/api-key`, {
        action: 'regenerate',
        keyId: keyId
      });
      
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? response.apiKey : key
      ));
      setPlainKey(response.plainKey);
      setShowPlainKey(true);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to regenerate API key');
    } finally {
      setRegeneratingKeyId(null);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!activeSpace?.id) return;
    
    // Check if user has required plan before allowing revocation
    if (!hasRequiredPlan) {
      return;
    }
    
    if (!confirm(t('revoke-confirm'))) return;
    
    try {
      setActionLoading(true);
      setError('');
      await basicApiDeleteCall(`/space/${activeSpace.id}/api-key?keyId=${keyId}`);
      
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
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

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {!hasRequiredPlan && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div>
                <h4 className="font-semibold text-foreground">{t('enterprise-required')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('enterprise-required-description')}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <Button 
                variant="outline"
                onClick={() => window.open('https://docs.hoox.video', '_blank')}
                className="w-full sm:w-auto"
              >
                <BookOpen className="h-4 w-4" />
                {t('view-documentation')}
              </Button>
              <Button 
                onClick={() => {
                  onClose?.()
                  router.push('/dashboard/pricing')
                }}
                className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
              >
                <Rocket className="h-4 w-4" />
                {t('upgrade-to-enterprise')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {hasRequiredPlan && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <BookOpen className="h-8 w-8 text-blue-700" />
              <div>
                <h4 className="font-semibold text-blue-700">{t('documentation-card-title')}</h4>
                <p className="text-sm text-blue-700">
                  {t('documentation-card-description')}
                </p>
              </div>
            </div>
            <Button 
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
              onClick={() => window.open('https://docs.hoox.video', '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              {t('view-documentation')}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className={`space-y-6 ${!hasRequiredPlan ? 'opacity-50 pointer-events-none' : ''}`}>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
                    <Check className="h-4 w-4" />
                    {t('copied')}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    {t('copy-key')}
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPlainKey(false)}
              >
                <EyeOff className="h-4 w-4" />
                {t('hide-key')}
              </Button>
            </div>
          </Alert>
        )}

        {/* Tableau des clés API */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('key-name-label')}</TableHead>
                <TableHead>{t('key-column')}</TableHead>
                <TableHead>{t('last-used')}</TableHead>
                <TableHead className="text-right">{t('actions-column')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Skeleton pendant le chargement
                <TableRow>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell className="font-medium">
                        {apiKey.name}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm text-muted-foreground">
                          {getKeyMask(apiKey.keyPrefix)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : t('last-used-never')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => regenerateApiKey(apiKey.id!)}
                            disabled={regeneratingKeyId === apiKey.id || !hasRequiredPlan}
                          >
                            {regeneratingKeyId === apiKey.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            {t('regenerate-button')}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => revokeApiKey(apiKey.id!)}
                            disabled={actionLoading || !hasRequiredPlan}
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                            {t('revoke-button')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Ligne de création d'une nouvelle clé - seulement si des clés existent */}
                  {apiKeys.length > 0 && (
                    <TableRow className="border-t-2 border-dashed">
                      <TableCell colSpan={3} className="p-2">
                        <Input
                          id="keyName"
                          value={keyName}
                          onChange={(e) => setKeyName(e.target.value)}
                          placeholder={t('key-name-placeholder')}
                          disabled={!hasRequiredPlan}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell className="text-right p-2">
                        <Button 
                          size="sm"
                          onClick={createApiKey}
                          disabled={actionLoading || !keyName.trim() || !hasRequiredPlan}
                        >
                          {actionLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Key className="h-3 w-3" />
                          )}
                          {t('add-key-button')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {/* Ligne vide si aucune clé */}
                  {apiKeys.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h4 className="text-lg font-semibold mb-2">{t('no-keys')}</h4>
                        <p className="text-sm text-muted-foreground mb-6">
                          {t('no-keys-description')}
                        </p>
                        
                        {/* Formulaire de création dans l'état vide */}
                        <div className="max-w-md mx-auto space-y-3">
                          <Input
                            id="keyNameEmpty"
                            value={keyName}
                            onChange={(e) => setKeyName(e.target.value)}
                            placeholder={t('key-name-placeholder')}
                            disabled={!hasRequiredPlan}
                            className="w-full"
                          />
                          <Button 
                            onClick={createApiKey}
                            disabled={actionLoading || !keyName.trim() || !hasRequiredPlan}
                            className="w-full"
                          >
                            {actionLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Key className="h-4 w-4" />
                            )}
                            {t('generate-button')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}