import { useState } from 'react'

import StepOne from './StepOne'
import StepThree from './StepThree'
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
      {step === 3 && <StepThree />}
    </>
  )
}

export default ForgotPassword
