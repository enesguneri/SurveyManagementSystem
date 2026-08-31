import axios from "axios";

/**
 * Backend API veya ağ hatalarını kullanıcı dostu, ayrıntılı ve net Türkçe mesajlara dönüştürür.
 */
export function extractErrorMessage(
    error: unknown,
    fallbackMessage = "Beklenmeyen bir hata oluştu.",
): string {
    if (axios.isAxiosError(error)) {
        // 1. Ağ veya Sunucuya Erişilememe Hatası (API kapalı, bağlantı kesik)
        if (error.code === "ERR_NETWORK" || !error.response) {
            return "Sunucuya bağlanılamadı. Lütfen backend API servisinin çalıştığından ve internet bağlantınızdan emin olun.";
        }

        const status = error.response.status;
        const data = error.response.data as
            | {
                  isSuccess?: boolean;
                  message?: string;
                  errors?: string[];
                  title?: string;
              }
            | undefined;

        // 2. 400 Bad Request / Validasyon Hataları
        if (status === 400) {
            if (
                data?.errors &&
                Array.isArray(data.errors) &&
                data.errors.length > 0
            ) {
                return data.errors.join(" ");
            }
            if (data?.message) {
                return data.message;
            }
            return "Gönderilen bilgiler kurallara uygun değil. Lütfen form alanlarını kontrol ediniz.";
        }

        // 3. 401 Unauthorized / Kimlik Doğrulama Hatası (Giriş hataları)
        if (status === 401) {
            if (data?.message) {
                return data.message;
            }
            return "Kullanıcı adı, e-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol ediniz.";
        }

        // 4. 403 Forbidden / Yetkisiz İşlem
        if (status === 403) {
            return (
                data?.message ??
                "Bu işlemi gerçekleştirmek için yetkiniz bulunmuyor."
            );
        }

        // 5. 404 Not Found
        if (status === 404) {
            return data?.message ?? "İstenen anket veya kaynak bulunamadı.";
        }

        // 6. 409 Conflict (Mükerrer Kayıt / Zaten Yanıt Verilmiş)
        if (status === 409) {
            return (
                data?.message ??
                "Bu işlem zaten daha önce gerçekleştirilmiş."
            );
        }

        // 7. 500+ Sunucu Hatası
        if (status >= 500) {
            return "Sunucu tarafında beklenmeyen bir hata oluştu. Lütfen biraz sonra tekrar deneyiniz.";
        }

        if (data?.message) {
            return data.message;
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return fallbackMessage;
}
