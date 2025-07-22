import React from "react";
import { InvoiceDemo } from "../components/InvoiceDemo";

const InvoiceExamples: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <InvoiceDemo />
      </div>
    </div>
  );
};

export default InvoiceExamples;
