"use client";

import Image from "next/image";
import styles from "./Products.module.scss";
import { useRouter } from "next/router";
import { usePathname, useSearchParams } from "next/navigation";

export default function Products({ data }) {
  console.log("Products");
  const pathname = usePathname();

  return (
    <>
      <div className={styles.products}>
        <Image src="./next.svg" alt="" width={200} height={50} />
      </div>
      <div>{pathname}</div>
      <div>
        {data.results.map((item) => (
          <div>{item.name}</div>
        ))}
      </div>
    </>
  );
}
