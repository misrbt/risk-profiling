import { useCallback, useEffect, useState } from "react";

export function useModal() {
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const openModal = useCallback((customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setSelectedCustomer(null);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") closeModal();
    };
    if (showModal) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showModal, closeModal]);

  return { showModal, openModal, closeModal, selectedCustomer, setSelectedCustomer };
}
