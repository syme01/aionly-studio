import { useState } from 'react'

import StepOne from './StepOne'
import StepTwo from './StepTwo'

const ForgotPassword = () => {
  const [step, setStep] = useState(1)
  const [validateResult, setValidateResult] = useState<any>(null)
  const changeStep = (newStep: number, data: any) => {
    setStep(newStep)
    // console.log('changeStep', data)
    setValidateResult(data)
  }
  return (
    <>
      {step === 1 && <StepOne changeStep={changeStep} />}
      {step === 2 && <StepTwo changeStep={changeStep} validateResult={validateResult} />}
    </>
  )
}

export default ForgotPassword
