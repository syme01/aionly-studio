import './styles.css'

import type { CSSProperties } from 'react'
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react'

import VerifyPoints from './Verify/VerifyPoints'
import VerifySlide from './Verify/VerifySlide'

interface ImgSize {
  width: string
  height: string
}

interface VerifyProps {
  captchaType: string
  figure?: number
  arith?: number
  mode?: string
  vSpace?: number
  explain?: string
  imgSize?: ImgSize
  blockSize?: { width: string; height: string }
  barSize?: { width: string; height: string }
  onSuccess?: (data: any) => void
  onError?: () => void
}

const Verify = ({
  ref,
  captchaType,
  mode = 'pop',
  vSpace,
  explain,
  imgSize = { width: '310px', height: '155px' },
  blockSize,
  barSize,
  onSuccess,
  onError
}: VerifyProps & { ref?: React.RefObject<any | null> }) => {
  const [clickShow, setClickShow] = useState(false)
  const [loading, setLoading] = useState(true)
  const [componentType, setComponentType] = useState<string>()
  const [verifyType, setVerifyType] = useState<string>()
  const instanceRef = useRef<any>(null)

  useEffect(() => {
    const uuid = () => {
      const s: any = []
      const hexDigits = '0123456789abcdef'
      for (let i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
      }
      s[14] = '4'
      s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1)
      s[8] = s[13] = s[18] = s[23] = '-'

      const slider = 'slider-' + s.join('')
      const point = 'point-' + s.join('')
      if (!localStorage.getItem('slider')) {
        localStorage.setItem('slider', slider)
      }
      if (!localStorage.getItem('point')) {
        localStorage.setItem('point', point)
      }
    }
    uuid()
  }, [])

  useEffect(() => {
    if (captchaType === 'blockPuzzle') {
      setVerifyType('2')
      setComponentType('VerifySlide')
    } else if (captchaType === 'clickWord') {
      setVerifyType('')
      setComponentType('VerifyPoints')
    }
  }, [captchaType])

  const showBox = mode === 'pop' ? clickShow : true

  const closeBox = () => {
    setClickShow(false)
    instanceRef.current?.refresh()
  }

  const show = () => {
    if (mode === 'pop') {
      instanceRef.current?.init()
      setClickShow(true)
    }
  }

  const closeLoading = () => {
    setLoading(false)
  }

  useImperativeHandle(ref, () => ({
    show,
    closeBox
  }))

  const boxStyle: CSSProperties = mode === 'pop' ? { maxWidth: `${parseInt(imgSize.width) + 30}px` } : {}

  return (
    <div className={mode === 'pop' ? 'mask' : ''} style={{ display: showBox ? 'block' : 'none' }}>
      <div className={mode === 'pop' ? 'verifybox' : ''} style={boxStyle}>
        {mode === 'pop' && (
          <div className="verifybox-top" style={{ fontSize: '16px' }}>
            请完成安全验证
            <span className="verifybox-close" onClick={closeBox}>
              <i className="iconfont icon-close"></i>
            </span>
          </div>
        )}
        <div
          className={loading ? 'verifybox-bottom loading' : 'verifybox-bottom'}
          style={{ padding: mode === 'pop' ? '15px' : '0' }}>
          {componentType === 'VerifySlide' && (
            <VerifySlide
              ref={instanceRef}
              captchaType={captchaType}
              type={verifyType}
              mode={mode}
              vSpace={vSpace}
              explain={explain}
              imgSize={imgSize}
              blockSize={blockSize}
              barSize={barSize}
              onReady={() => {}}
              onSuccess={onSuccess}
              onError={onError}
              onCloseLoading={closeLoading}
            />
          )}
          {componentType === 'VerifyPoints' && (
            <VerifyPoints
              ref={instanceRef}
              captchaType={captchaType}
              mode={mode}
              vSpace={vSpace}
              imgSize={imgSize}
              barSize={barSize}
              onReady={() => {}}
              onSuccess={onSuccess}
              onError={onError}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Verify
