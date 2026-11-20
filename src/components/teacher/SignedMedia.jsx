import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";

export default function SignedMedia({ uri, kind = "image" }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let active = true;
    setUrl("");
    if (!uri) return undefined;
    // Library lessons from the Admin application use public https links.
    if (/^https:\/\//i.test(uri)) {
      setUrl(uri);
      return undefined;
    }
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 3600 })
      .then((result) => {
        if (active) setUrl(result?.signed_url || "");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [uri]);

  if (!url) return null;
  if (kind === "audio") return <audio controls src={url} className="w-full" />;
  if (kind === "video") return <video controls src={url} className="w-full rounded-xl bg-black/5" />;
  return <Image src={url} alt="Lesson illustration" fittingType="fit" className="max-h-48 w-full rounded-xl" />;
}
