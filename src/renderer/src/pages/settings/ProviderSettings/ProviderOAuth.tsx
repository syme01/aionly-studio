import AI302ProviderLogo from '@renderer/assets/images/providers/302ai.webp'
import AiHubMixProviderLogo from '@renderer/assets/images/providers/aihubmix.webp'
import AiOnlyProviderLogo from '@renderer/assets/images/providers/aiOnly.webp'
import PPIOProviderLogo from '@renderer/assets/images/providers/ppio.png'
import SiliconFlowProviderLogo from '@renderer/assets/images/providers/silicon.png'
import TokenFluxProviderLogo from '@renderer/assets/images/providers/tokenflux.png'
import { HStack } from '@renderer/components/Layout'
import { PROVIDER_URLS } from '@renderer/config/providers'
import { useProvider } from '@renderer/hooks/useProvider'
import ApiOptionsSettingsPopup from '@renderer/pages/settings/ProviderSettings/ApiOptionsSettings/ApiOptionsSettingsPopup'
import { isSystemProvider } from '@renderer/types'
import { providerBills, providerCharge } from '@renderer/utils/oauth'
import { isSupportAnthropicPromptCacheProvider } from '@renderer/utils/provider'
import { Button } from 'antd'
import Link from 'antd/es/typography/Link'
import type { FC } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  providerId: string
  fancyProviderName: string
}

const PROVIDER_LOGO_MAP = {
  '302ai': AI302ProviderLogo,
  silicon: SiliconFlowProviderLogo,
  aihubmix: AiHubMixProviderLogo,
  ppio: PPIOProviderLogo,
  tokenflux: TokenFluxProviderLogo,
  aionly: AiOnlyProviderLogo
}

const ProviderOAuth: FC<Props> = ({ providerId, fancyProviderName }) => {
  const { t } = useTranslation()
  const { provider, updateProvider } = useProvider(providerId)

  // TODO: 这里需要更新ApiKey
  const setApiKey = (newKey: string) => {
    updateProvider({ apiKey: newKey, enabled: true })
  }

  let providerWebsite =
    PROVIDER_URLS[provider.id]?.api?.url.replace('https://', '').replace('api.', '') || provider.name
  if (provider.id === 'ppio') {
    providerWebsite = 'ppio.com'
  }

  return (
    <Container>
      <div className="left flex items-center gap-3">
        <div className="logo">
          <img src={PROVIDER_LOGO_MAP[provider.id]} alt={provider.name} />
        </div>
        <div className="info">
          <div className="name">{fancyProviderName}</div>
          <Description>
            <Trans
              i18nKey="settings.provider.oauth.description"
              components={{
                website: (
                  <OfficialWebsite
                    key="website"
                    href={PROVIDER_URLS[provider.id].websites.official}
                    target="_blank"
                    rel="noreferrer"
                  />
                )
              }}
              values={{ provider: providerWebsite }}
            />
          </Description>
          <div className="mt-2 flex items-center gap-2">
            <Link target="_blank" href={PROVIDER_URLS[provider.id].websites.official} style={{ display: 'flex' }}>
              <LinkButton>{t('settings.provider.api.options.website')}</LinkButton>
            </Link>
            {(!isSystemProvider(provider) || isSupportAnthropicPromptCacheProvider(provider)) && (
              <LinkButton onClick={() => ApiOptionsSettingsPopup.show({ providerId: provider.id })}>
                {t('settings.provider.api.options.label')}
              </LinkButton>
            )}
          </div>
        </div>
      </div>

      {/*<OAuthButton provider={provider} onSuccess={setApiKey}>
        {t('settings.provider.oauth.button', { provider: getProviderLabel(provider.id) })}
      </OAuthButton>*/}

      <div className="right">
        <HStack gap={10}>
          <Button type="primary" onClick={() => providerCharge(provider.id)}>
            {t('settings.provider.charge')}
          </Button>
          <Button type="primary" onClick={() => providerBills(provider.id)}>
            {t('settings.provider.bills')}
          </Button>
        </HStack>
      </div>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border-radius: 6px;

  body.light & {
    background-color: #F4F6F9;
  }

  .logo{
    width: 60px;
    border-radius: 50%;
    background-color: #fff;
    padding: 10px;
    img{
      width: 100%;
    }
  }
`

const Description = styled.div`
  font-size: 11px;
  color: var(--color-text-2);
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 2px;
`

const OfficialWebsite = styled.a`
  text-decoration: none;
  color: var(--color-text-2);
`

const LinkButton = styled.span`
  display: inline-block;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  &:hover{
    background-color: var(--color-primary);
    color: #fff;
  }
`

export default ProviderOAuth
