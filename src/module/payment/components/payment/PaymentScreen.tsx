import { useState, useEffect } from 'react'
import { Smartphone, QrCode, Wallet, ChevronRight, CheckCircle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import type { SessionData } from './PreAuth'

interface PaymentScreenProps {
  session: SessionData
  finalAmount: number
  onSuccess: (txnId: string, method: string) => void
}

type PaymentMethod = 'upi' | 'qr' | 'wallet'
type PaymentState = 'idle' | 'processing' | 'success'

const generateTxnId = () =>
  'CG' + Math.floor(Math.random() * 9000000 + 1000000)

function QrCountdown() {
  const [secs, setSecs] = useState(300)
  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [])
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return (
    <p className={`text-xs font-medium ${secs < 60 ? 'text-red-500' : 'text-emerald-600'}`}>
      {secs === 0
        ? 'QR expired — refresh'
        : `Expires in ${m}:${String(s).padStart(2, '0')} min`}
    </p>
  )
}

export default function PaymentScreen({
  session,
  finalAmount,
  onSuccess,
}: PaymentScreenProps) {
  const [method, setMethod] = useState<PaymentMethod>('upi')
  const [upiId, setUpiId] = useState('')
  const [upiError, setUpiError] = useState('')
  const [paymentState, setPaymentState] = useState<PaymentState>('idle')
  const [processingText, setProcessingText] = useState('')

  const WALLET_BALANCE = 120.0

  // Real UPI deep link — scannable by GPay, PhonePe, Paytm
  const upiPaymentString = `upi://pay?pa=chargegrid@okaxis&pn=CHARGE-GRID&am=${finalAmount}&cu=INR&tn=EV+Charging+Slot+${session.station.slotNumber}`

  const validateUpi = (id: string) => {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/
    return upiRegex.test(id)
  }

  const handlePay = () => {
    if (method === 'upi') {
      if (!upiId) {
        setUpiError('Please enter your UPI ID')
        return
      }
      if (!validateUpi(upiId)) {
        setUpiError('Invalid UPI ID. Format: name@bank')
        return
      }
    }

    setUpiError('')
    setPaymentState('processing')
    setProcessingText('Connecting to UPI...')
    setTimeout(() => setProcessingText('Verifying payment...'), 1000)
    setTimeout(() => setProcessingText('Confirming transaction...'), 2000)
    setTimeout(() => {
      setPaymentState('success')
      setTimeout(() => {
        onSuccess(generateTxnId(), method)
      }, 1500)
    }, 3000)
  }

  // ── Processing screen ──
  if (paymentState === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center gap-5">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-base font-medium text-gray-700">{processingText}</p>
            <p className="text-sm text-gray-400 mt-1">Do not close or go back</p>
          </div>
          <div className="bg-emerald-50 rounded-xl px-6 py-3 text-center">
            <p className="text-xs text-emerald-600">Paying</p>
            <p className="text-2xl font-bold text-emerald-700">₹{finalAmount}</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Success screen ──
  if (paymentState === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle size={36} className="text-emerald-600" />
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-800">Payment successful!</p>
            <p className="text-sm text-gray-400 mt-1">Generating your receipt...</p>
          </div>
          <p className="text-3xl font-bold text-emerald-600">₹{finalAmount}</p>
        </div>
      </div>
    )
  }

  // ── Main payment screen ──
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100">

        {/* Header */}
        <div className="bg-emerald-600 rounded-t-2xl px-5 py-4">
          <p className="text-emerald-100 text-xs">CHARGE-GRID</p>
          <h1 className="text-white font-medium text-lg">Payment</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <div className="w-2 h-1.5 bg-emerald-200 rounded-full" />
          <div className="w-2 h-1.5 bg-emerald-200 rounded-full" />
          <div className="w-2 h-1.5 bg-emerald-200 rounded-full" />
          <div className="w-6 h-1.5 bg-emerald-600 rounded-full" />
          <div className="w-2 h-1.5 bg-gray-200 rounded-full" />
        </div>

        <div className="p-5 space-y-4">

          {/* Amount */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
            <p className="text-xs text-emerald-600 mb-1">Total payable</p>
            <p className="text-4xl font-bold text-emerald-700">₹{finalAmount}</p>
            <p className="text-xs text-emerald-500 mt-1">{session.station.name}</p>
          </div>

          <p className="text-xs font-medium text-gray-500 px-1">
            Choose payment method
          </p>

          {/* ── UPI ID ── */}
          <div
            onClick={() => setMethod('upi')}
            className={`border rounded-xl p-4 cursor-pointer transition-all ${
              method === 'upi'
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                method === 'upi' ? 'border-emerald-500' : 'border-gray-300'
              }`}>
                {method === 'upi' && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Smartphone size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">UPI ID</p>
                <p className="text-xs text-gray-400">Enter VPA and confirm on your UPI app</p>
              </div>
            </div>

            {method === 'upi' && (
              <div className="mt-3 ml-7">
                <input
                  type="text"
                  placeholder="yourname@okaxis"
                  value={upiId}
                  onChange={(e) => {
                    setUpiId(e.target.value)
                    setUpiError('')
                  }}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-emerald-400"
                />
                {upiError && (
                  <p className="text-xs text-red-500 mt-1">{upiError}</p>
                )}
                <div className="flex gap-2 mt-2">
                  {['@okaxis', '@paytm', '@ybl'].map((suffix) => (
                    <button
                      key={suffix}
                      onClick={(e) => {
                        e.stopPropagation()
                        setUpiId(upiId.split('@')[0] + suffix)
                      }}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-md transition-colors"
                    >
                      {suffix}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── QR Code ── */}
          <div
            onClick={() => setMethod('qr')}
            className={`border rounded-xl p-4 cursor-pointer transition-all ${
              method === 'qr'
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                method === 'qr' ? 'border-emerald-500' : 'border-gray-300'
              }`}>
                {method === 'qr' && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </div>
              <div className="bg-purple-100 p-2 rounded-lg">
                <QrCode size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Scan QR code</p>
                <p className="text-xs text-gray-400">Dynamic QR unique to this session</p>
              </div>
            </div>

            {method === 'qr' && (
              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="p-3 bg-white border-2 border-gray-200 rounded-xl">
                  <QRCodeSVG
                    value={upiPaymentString}
                    size={160}
                    bgColor="#ffffff"
                    fgColor="#111111"
                    level="H"
                    imageSettings={{
                      src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='4' fill='%231D9E75'/%3E%3Ctext x='12' y='17' text-anchor='middle' fill='white' font-size='14'%3E⚡%3C/text%3E%3C/svg%3E",
                      height: 32,
                      width: 32,
                      excavate: true,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400">Open GPay / PhonePe / Paytm and scan</p>
                <QrCountdown />
              </div>
            )}
          </div>

          {/* ── Wallet ── */}
          <div
            onClick={() => setMethod('wallet')}
            className={`border rounded-xl p-4 cursor-pointer transition-all ${
              method === 'wallet'
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                method === 'wallet' ? 'border-emerald-500' : 'border-gray-300'
              }`}>
                {method === 'wallet' && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </div>
              <div className="bg-amber-100 p-2 rounded-lg">
                <Wallet size={16} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">CHARGE-GRID Wallet</p>
                <p className="text-xs text-gray-400">Instant deduction · no UPI needed</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-emerald-600">₹{WALLET_BALANCE}</p>
                <p className="text-xs text-gray-400">balance</p>
              </div>
            </div>

            {method === 'wallet' && (
              <div className="mt-3 ml-7 bg-white border border-gray-100 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Current balance</span>
                  <span className="font-medium">₹{WALLET_BALANCE}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">After payment</span>
                  <span className="font-medium text-emerald-600">
                    ₹{(WALLET_BALANCE - finalAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Security note */}
          <div className="flex items-center justify-center gap-2">
            <div className="h-px bg-gray-100 flex-1" />
            <p className="text-xs text-gray-400">Secured · 256-bit encrypted</p>
            <div className="h-px bg-gray-100 flex-1" />
          </div>

          {/* Pay button */}
          <button
            onClick={handlePay}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Pay ₹{finalAmount} via{' '}
            {method === 'upi' ? 'UPI' : method === 'qr' ? 'QR' : 'Wallet'}
            <ChevronRight size={18} />
          </button>

        </div>
      </div>
    </div>
  )
}