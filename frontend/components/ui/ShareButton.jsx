"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import SocialActionButton from "./SocialActionButton.jsx";

export default function ShareButton({ title = "ClipSphere video", url = "", className = "" }) {
  const { showError } = useApp();
  const [pending, setPending] = useState(false);
  const [shared, setShared] = useState(false);

  const resolvedUrl = useMemo(() => {
    if (url) {
      return url;
    }

    if (typeof window !== "undefined") {
      return window.location.href;
    }

    return "";
  }, [url]);

  const handleShare = async () => {
    if (!resolvedUrl || pending) {
      return;
    }

    setPending(true);
    setShared(true);

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          url: resolvedUrl,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(resolvedUrl);
      } else {
        throw new Error("Sharing is not supported in this browser");
      }
    } catch (error) {
      setShared(false);
      showError(error.message || "Unable to share this video");
    } finally {
      setPending(false);
      window.setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <SocialActionButton
      icon={Send}
      label={shared ? "Shared" : "Share"}
      active={shared}
      pending={pending}
      onClick={handleShare}
      className={className}
    />
  );
}
