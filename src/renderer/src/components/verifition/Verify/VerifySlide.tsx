import React, { CSSProperties, useEffect, useImperativeHandle, useRef, useState } from 'react'

import { reqCheck, reqGet } from '../api/index'
import { aesEncrypt } from '../utils/ase'
import { resetSize } from '../utils/util'

interface VerifySlideProps {
  captchaType: string
  type?: string
  mode?: string
  vSpace?: number
  explain?: string
  imgSize?: { width: string; height: string }
  blockSize?: { width: string; height: string }
  barSize?: { width: string; height: string }
  onReady?: () => void
  onSuccess?: (data: any) => void
  onError?: () => void
  onCloseLoading?: () => void
}

const VerifySlide = ({ ref, ...props }: VerifySlideProps & { ref?: React.RefObject<any | null> }) => {
  const {
    captchaType,
    type = '1',
    mode = 'fixed',
    vSpace = 5,
    explain = '向右滑动完成验证',
    imgSize = { width: '310px', height: '155px' },
    blockSize = { width: '50px', height: '50px' },
    barSize = { width: '310px', height: '40px' },
    onReady,
    onSuccess,
    onError,
    onCloseLoading
  } = props

  const [secretKey, setSecretKey] = useState('')
  const [passFlag, setPassFlag] = useState(false)
  const [backImgBase, setBackImgBase] = useState('')
  const [blockBackImgBase, setBlockBackImgBase] = useState('')
  const [backToken, setBackToken] = useState('')
  const [startMoveTime, setStartMoveTime] = useState(0)
  const [endMovetime, setEndMovetime] = useState(0)
  const [tipWords, setTipWords] = useState('')
  const [text, setText] = useState('')
  const [finishText, setFinishText] = useState('')
  const [setSize, setSetSize] = useState({ imgHeight: '0', imgWidth: '0', barHeight: '0', barWidth: '0' })
  const [moveBlockLeft, setMoveBlockLeft] = useState<string | undefined>(undefined)
  const [leftBarWidth, setLeftBarWidth] = useState<string | undefined>(undefined)
  const [moveBlockBackgroundColor, setMoveBlockBackgroundColor] = useState<string | undefined>(undefined)
  const [leftBarBorderColor, setLeftBarBorderColor] = useState('#ddd')
  const [iconColor, setIconColor] = useState<string | undefined>(undefined)
  const [iconClass, setIconClass] = useState('icon-right')
  const [status, setStatus] = useState(false)
  const [isEnd, setIsEnd] = useState(false)
  const [showRefresh, setShowRefresh] = useState(true)
  const [transitionLeft, setTransitionLeft] = useState('')
  const [transitionWidth, setTransitionWidth] = useState('')
  const [startLeft, setStartLeft] = useState(0)

  const barAreaRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const getPictrue = () => {
    const data = {
      captchaType,
      clientUid: localStorage.getItem('slider'),
      ts: Date.now()
    }
    reqGet(data).then((res: any) => {
      if (res.repCode === '0000') {
        setBackImgBase(res.repData.originalImageBase64)
        setBlockBackImgBase(res.repData.jigsawImageBase64)
        setBackToken(res.repData.token)
        setSecretKey(res.repData.secretKey)
      } else {
        setTipWords(res.repMsg)
      }
    })
  }

  const init = () => {
    setText(explain)
    getPictrue()
    setTimeout(() => {
      const size = resetSize({ $el: containerRef.current, imgSize, barSize })
      setSetSize(size)
      onReady?.()
    }, 0)
  }

  useImperativeHandle(ref, () => ({
    init,
    refresh
  }))

  useEffect(() => {
    init()
  }, [type])

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    const event = e.nativeEvent as MouseEvent | TouchEvent
    const x = 'touches' in event ? event.touches[0].pageX : event.clientX
    const barAreaLeft = barAreaRef.current?.getBoundingClientRect().left || 0
    setStartLeft(Math.floor(x - barAreaLeft))
    setStartMoveTime(Date.now())
    if (!isEnd) {
      setText('')
      setMoveBlockBackgroundColor('#337ab7')
      setLeftBarBorderColor('#337AB7')
      setIconColor('#fff')
      e.stopPropagation()
      setStatus(true)
    }
  }

  const move = (e: MouseEvent | TouchEvent) => {
    if (status && !isEnd) {
      const x = 'touches' in e ? e.touches[0].pageX : e.clientX
      const barAreaLeft = barAreaRef.current?.getBoundingClientRect().left || 0
      let moveBlockLeftVal = x - barAreaLeft
      const maxLeft = (barAreaRef.current?.offsetWidth || 0) - parseInt(blockSize.width) / 2 - 2
      if (moveBlockLeftVal >= maxLeft) {
        moveBlockLeftVal = maxLeft
      }
      if (moveBlockLeftVal <= 0) {
        moveBlockLeftVal = parseInt(blockSize.width) / 2
      }
      setMoveBlockLeft(moveBlockLeftVal - startLeft + 'px')
      setLeftBarWidth(moveBlockLeftVal - startLeft + 'px')
    }
  }

  const end = () => {
    setEndMovetime(Date.now())
    if (status && !isEnd) {
      let moveLeftDistance = parseInt((moveBlockLeft || '').replace('px', ''))
      moveLeftDistance = (moveLeftDistance * 310) / parseInt(setSize.imgWidth)
      const data = {
        captchaType,
        pointJson: secretKey
          ? aesEncrypt(JSON.stringify({ x: moveLeftDistance, y: 5.0 }), secretKey)
          : JSON.stringify({ x: moveLeftDistance, y: 5.0 }),
        token: backToken
      }
      reqCheck(data).then((res: any) => {
        if (res.repCode === '0000') {
          res.repData.token && localStorage.setItem('tokenValidate', res.repData.token)
          setMoveBlockBackgroundColor('#5cb85c')
          setLeftBarBorderColor('#5cb85c')
          setIconColor('#fff')
          setIconClass('icon-check')
          setShowRefresh(false)
          setIsEnd(true)
          if (mode === 'pop') {
            setTimeout(() => {
              refresh()
            }, 1500)
          }
          setPassFlag(true)
          setTipWords(`${((endMovetime - startMoveTime) / 1000).toFixed(2)}s验证成功`)
          const captchaVerification = secretKey
            ? aesEncrypt(backToken + '---' + JSON.stringify({ x: moveLeftDistance, y: 5.0 }), secretKey)
            : backToken + '---' + JSON.stringify({ x: moveLeftDistance, y: 5.0 })
          setTimeout(() => {
            setTipWords('')
            onSuccess?.({ captchaVerification })
          }, 1000)
        } else {
          setMoveBlockBackgroundColor('#d9534f')
          setLeftBarBorderColor('#d9534f')
          setIconColor('#fff')
          setIconClass('icon-close')
          setPassFlag(false)
          setTimeout(() => {
            refresh()
          }, 1000)
          onError?.()
          setTipWords('验证失败')
          setTimeout(() => {
            setTipWords('')
          }, 1000)
        }
      })
      setStatus(false)
    }
  }

  useEffect(() => {
    window.addEventListener('mousemove', move)
    window.addEventListener('touchmove', move)
    window.addEventListener('mouseup', end)
    window.addEventListener('touchend', end)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('mouseup', end)
      window.removeEventListener('touchend', end)
    }
  })

  const refresh = () => {
    setShowRefresh(true)
    setFinishText('')
    setTransitionLeft('left .3s')
    setMoveBlockLeft('0')
    setLeftBarWidth(undefined)
    setTransitionWidth('width .3s')
    setLeftBarBorderColor('#ddd')
    setMoveBlockBackgroundColor('#fff')
    setIconColor('#000')
    setIconClass('icon-right')
    setIsEnd(false)
    getPictrue()
    setTimeout(() => {
      setTransitionWidth('')
      setTransitionLeft('')
      setText(explain)
    }, 300)
  }

  const handlerImgLoad = () => {
    onCloseLoading?.()
  }

  const moveBlockStyle: CSSProperties = {
    width: barSize.height,
    height: barSize.height,
    backgroundColor: moveBlockBackgroundColor,
    left: moveBlockLeft,
    transition: transitionLeft
  }

  const subBlockStyle: CSSProperties = {
    width: Math.floor((parseInt(setSize.imgWidth) * 47) / 310) + 'px',
    height: setSize.imgHeight,
    top: '-' + (parseInt(setSize.imgHeight) + vSpace) + 'px',
    backgroundSize: setSize.imgWidth + ' ' + setSize.imgHeight
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {type === '2' && (
        <div className="verify-img-out" style={{ height: parseInt(setSize.imgHeight) + vSpace + 'px' }}>
          <div className="verify-img-panel" style={{ width: setSize.imgWidth, height: setSize.imgHeight }}>
            <img
              src={'data:image/png;base64,' + backImgBase}
              style={{ width: '100%', height: '100%', display: 'block' }}
              onLoad={handlerImgLoad}
            />
            <div className="verify-refresh" onClick={refresh} style={{ display: showRefresh ? 'block' : 'none' }}>
              <i className="iconfont icon-refresh"></i>
            </div>
            {tipWords && <span className={`verify-tips ${passFlag ? 'suc-bg' : 'err-bg'}`}>{tipWords}</span>}
          </div>
        </div>
      )}
      <div
        ref={barAreaRef}
        className="verify-bar-area"
        style={{
          width: setSize.imgWidth,
          height: barSize.height,
          lineHeight: barSize.height,
          fontSize: '14px'
        }}>
        <span className="verify-msg">{text}</span>
        <div
          className="verify-left-bar"
          style={{
            width: leftBarWidth !== undefined ? leftBarWidth : barSize.height,
            height: barSize.height,
            borderColor: leftBarBorderColor,
            transition: transitionWidth
          }}>
          <span className="verify-msg">{finishText}</span>
          <div className="verify-move-block" onTouchStart={start} onMouseDown={start} style={moveBlockStyle}>
            <i className={`verify-icon iconfont ${iconClass}`} style={{ color: iconColor }}></i>
            {type === '2' && (
              <div className="verify-sub-block" style={subBlockStyle}>
                <img
                  src={'data:image/png;base64,' + blockBackImgBase}
                  alt=""
                  style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifySlide
