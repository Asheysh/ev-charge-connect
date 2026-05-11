import { useState } from "react";

import PreAuth from "../components/payment/PreAuth";
import type { SessionData } from "../components/payment/PreAuth";

import LiveSession from "../components/payment/LiveSession";
import BillSummary from "../components/payment/BillSummary";
import PaymentScreen from "../components/payment/PaymentScreen";
import Receipt from "../components/payment/Receipt";

type Screen =
  | "preauth"
  | "live"
  | "bill"
  | "payment"
  | "receipt";

function Payment() {
  const [screen, setScreen] =
    useState<Screen>("preauth");

  const [session, setSession] =
    useState<SessionData | null>(null);

  const [kWhUsed, setKWhUsed] =
    useState(0);

  const [totalAmount, setTotalAmount] =
    useState(0);

  const [finalAmount, setFinalAmount] =
    useState(0);

  const [txnId, setTxnId] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("");

  const handleAuthorize = (
    sessionData: SessionData
  ) => {
    setSession(sessionData);
    setScreen("live");
  };

  const handleStop = (
    kWh: number,
    amount: number
  ) => {
    setKWhUsed(kWh);
    setTotalAmount(amount);
    setScreen("bill");
  };

  const handleProceed = (
    amount: number
  ) => {
    setFinalAmount(amount);
    setScreen("payment");
  };

  const handleSuccess = (
    id: string,
    method: string
  ) => {
    setTxnId(id);
    setPaymentMethod(method);
    setScreen("receipt");
  };

  const handleDispute = () => {
    alert(
      "Dispute raised! Our team will contact you."
    );
  };

  const handleHome = () => {
    setScreen("preauth");

    setSession(null);

    setKWhUsed(0);

    setTotalAmount(0);

    setFinalAmount(0);

    setTxnId("");

    setPaymentMethod("");
  };

  const handleCancel = () => {
    alert("Cancelled");
  };

  if (screen === "live" && session) {
    return (
      <LiveSession
        session={session}
        onStop={handleStop}
      />
    );
  }

  if (screen === "bill" && session) {
    return (
      <BillSummary
        session={session}
        kWhUsed={kWhUsed}
        totalAmount={totalAmount}
        onProceed={handleProceed}
        onDispute={handleDispute}
      />
    );
  }

  if (screen === "payment" && session) {
    return (
      <PaymentScreen
        session={session}
        finalAmount={finalAmount}
        onSuccess={handleSuccess}
      />
    );
  }

  if (screen === "receipt" && session) {
    return (
      <Receipt
        session={session}
        finalAmount={finalAmount}
        kWhUsed={kWhUsed}
        txnId={txnId}
        paymentMethod={paymentMethod}
        onHome={handleHome}
      />
    );
  }

  return (
    <PreAuth
      onAuthorize={handleAuthorize}
      onCancel={handleCancel}
    />
  );
}

export default Payment;