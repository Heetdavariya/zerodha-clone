import { createContext, useState, useCallback } from "react";

const GeneralContext = createContext(null);

export const GeneralProvider = ({ children }) => {
  const [isBuyWindowOpen, setIsBuyWindowOpen] = useState(false);
  const [isSellWindowOpen, setIsSellWindowOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  // Call this after any action that changes data (buy, sell, watchlist add/remove)
  const triggerRefresh = useCallback(() => {
    setRefreshCount((c) => c + 1);
  }, []);

  const openBuyWindow = (stockName) => {
    setSelectedStock(stockName);
    setIsBuyWindowOpen(true);
    setIsSellWindowOpen(false);
  };
  const openSellWindow = (stockName) => {
    setSelectedStock(stockName);
    setIsSellWindowOpen(true);
    setIsBuyWindowOpen(false);
  };
  const closeBuyWindow = (didTrade) => {
    setIsBuyWindowOpen(false);
    if (didTrade) triggerRefresh();
  };
  const closeSellWindow = (didTrade) => {
    setIsSellWindowOpen(false);
    if (didTrade) triggerRefresh();
  };

  return (
    <GeneralContext.Provider value={{
      isBuyWindowOpen, isSellWindowOpen, selectedStock,
      openBuyWindow, openSellWindow, closeBuyWindow, closeSellWindow,
      refreshCount, triggerRefresh
    }}>
      {children}
    </GeneralContext.Provider>
  );
};

export default GeneralContext;
