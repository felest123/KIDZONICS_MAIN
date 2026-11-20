import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

export default function StudentPhoto({ uri, name = "", className = "", rounded = "rounded-xl" }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let active = true;
    setUrl("");
    if (!uri) return undefined;
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 3600 })
      .then((result) => {
        if (active) setUrl(result?.signed_url || "");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [uri]);

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden bg-[#e8f1ef] text-[#7d9ba0]",
        rounded,
        className
      )}
    >
      {url ? (
        <Image
          src={url}
          alt={name ? `${name} profile picture` : "Student profile picture"}
          fittingType="fill"
          className="h-full w-full"
        />
      ) : (
        <UserRound className="h-[62%] w-[62%]" strokeWidth={1.7} />
      )}
    </span>
  );
}
