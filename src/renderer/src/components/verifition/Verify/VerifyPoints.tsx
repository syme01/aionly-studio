import React, { useEffect, useImperativeHandle, useRef, useState } from 'react'

import { reqCheck, reqGet } from '../api/index'
import { aesEncrypt } from '../utils/ase'
import { resetSize } from '../utils/util'

interface Point {
  x: number
  y: number
}

interface VerifyPointsProps {
  mode?: string
  captchaType: string
  vSpace?: number
  imgSize?: { width: string; height: string }
  barSize?: { width: string; height: string }
  onReady?: () => void
  onSuccess?: (data: any) => void
  onError?: () => void
}

const VerifyPoints = ({ ref, ...props }: VerifyPointsProps & { ref?: React.RefObject<any | null> }) => {
  const {
    mode = 'fixed',
    captchaType,
    vSpace = 5,
    imgSize = { width: '310px', height: '155px' },
    barSize = { width: '310px', height: '40px' },
    onReady,
    onSuccess,
    onError
  } = props

  const [secretKey, setSecretKey] = useState('')
  const [checkNum] = useState(3)
  const [_fontPos, setFontPos] = useState<Point[]>([])
  const [checkPosArr, setCheckPosArr] = useState<Point[]>([])
  const [num, setNum] = useState(1)
  const [pointBackImgBase, setPointBackImgBase] = useState('')
  const [_poinTextList, setPoinTextList] = useState<string[]>([])
  const [backToken, setBackToken] = useState('')
  const [setSize, setSetSize] = useState({ imgHeight: '0', imgWidth: '0', barHeight: '0', barWidth: '0' })
  const [tempPoints, setTempPoints] = useState<Point[]>([])
  const [text, setText] = useState('')
  const [barAreaColor, setBarAreaColor] = useState<string | undefined>(undefined)
  const [barAreaBorderColor, setBarAreaBorderColor] = useState<string | undefined>(undefined)
  const [showRefresh, setShowRefresh] = useState(true)
  const [bindingClick, setBindingClick] = useState(true)

  const canvasRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const getPictrue = () => {
    const data = {
      captchaType,
      clientUid: localStorage.getItem('point'),
      ts: Date.now()
    }
    reqGet(data).then((res: any) => {
      if (res.repCode === '0000') {
        setPointBackImgBase(res.repData.originalImageBase64)
        setBackToken(res.repData.token)
        setSecretKey(res.repData.secretKey)
        setPoinTextList(res.repData.wordList)
        setText('请依次点击【' + res.repData.wordList.join(',') + '】')
      } else {
        setText(res.repMsg)
      }
    })
  }

  const init = () => {
    setFontPos([])
    setCheckPosArr([])
    setNum(1)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getMousePos = (e: React.MouseEvent): Point => {
    const x = e.nativeEvent.offsetX
    const y = e.nativeEvent.offsetY
    return { x, y }
  }

  const createPoint = (pos: Point): number => {
    setTempPoints((prev) => [...prev, { ...pos }])
    return num + 1
  }

  const pointTransfrom = (pointArr: Point[], imgSize: any): Point[] => {
    return pointArr.map((p) => {
      const x = Math.round((310 * p.x) / parseInt(imgSize.imgWidth))
      const y = Math.round((155 * p.y) / parseInt(imgSize.imgHeight))
      return { x, y }
    })
  }

  const canvasClick = (e: React.MouseEvent) => {
    const newCheckPosArr = [...checkPosArr, getMousePos(e)]
    setCheckPosArr(newCheckPosArr)

    if (num === checkNum) {
      setNum(createPoint(getMousePos(e)))
      const arr = pointTransfrom(newCheckPosArr, setSize)
      setCheckPosArr(arr)

      setTimeout(() => {
        const captchaVerification = secretKey
          ? aesEncrypt(backToken + '---' + JSON.stringify(arr), secretKey)
          : backToken + '---' + JSON.stringify(arr)
        const data = {
          captchaType,
          pointJson: secretKey ? aesEncrypt(JSON.stringify(arr), secretKey) : JSON.stringify(arr),
          token: backToken
        }
        reqCheck(data).then((res: any) => {
          if (res.repCode === '0000') {
            setBarAreaColor('#4cae4c')
            setBarAreaBorderColor('#5cb85c')
            setText('验证成功')
            setBindingClick(false)
            if (mode === 'pop') {
              setTimeout(() => {
                refresh()
              }, 1500)
            }
            onSuccess?.({ captchaVerification })
          } else {
            onError?.()
            setBarAreaColor('#d9534f')
            setBarAreaBorderColor('#d9534f')
            setText('验证失败')
            setTimeout(() => {
              refresh()
            }, 700)
          }
        })
      }, 400)
    }
    if (num < checkNum) {
      setNum(createPoint(getMousePos(e)))
    }
  }

  const refresh = () => {
    setTempPoints([])
    setBarAreaColor('#000')
    setBarAreaBorderColor('#ddd')
    setBindingClick(true)
    setFontPos([])
    setCheckPosArr([])
    setNum(1)
    getPictrue()
    setText('验证失败')
    setShowRefresh(true)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div className="verify-img-out">
        <div
          className="verify-img-panel"
          style={{
            width: setSize.imgWidth,
            height: setSize.imgHeight,
            backgroundSize: setSize.imgWidth + ' ' + setSize.imgHeight,
            marginBottom: vSpace + 'px'
          }}>
          <div
            className="verify-refresh"
            style={{ zIndex: 3, display: showRefresh ? 'block' : 'none' }}
            onClick={refresh}>
            <i className="iconfont icon-refresh"></i>
          </div>
          <img
            ref={canvasRef}
            src={'data:image/png;base64,' + pointBackImgBase}
            alt=""
            style={{ width: '100%', height: '100%', display: 'block' }}
            onClick={bindingClick ? canvasClick : undefined}
          />
          {tempPoints.map((tempPoint, index) => (
            <div
              key={index}
              className="point-area"
              style={{
                backgroundColor: '#1abd6c',
                color: '#fff',
                zIndex: 9999,
                width: '20px',
                height: '20px',
                textAlign: 'center',
                lineHeight: '20px',
                borderRadius: '50%',
                position: 'absolute',
                top: parseInt(String(tempPoint.y - 10)) + 'px',
                left: parseInt(String(tempPoint.x - 10)) + 'px'
              }}>
              {index + 1}
            </div>
          ))}
        </div>
      </div>
      <div
        className="verify-bar-area"
        style={{
          width: setSize.imgWidth,
          color: barAreaColor,
          borderColor: barAreaBorderColor,
          lineHeight: barSize.height
        }}>
        <span className="verify-msg">{text}</span>
      </div>
    </div>
  )
}

export default VerifyPoints
