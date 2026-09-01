import os
import glob
import re

def main():
    search_dir = r"c:\Users\USER\Desktop\iti\SmartRoadmap\apps\web\src"
    files = glob.glob(os.path.join(search_dir, "**", "*.tsx"), recursive=True)
    files.extend(glob.glob(os.path.join(search_dir, "**", "*.ts"), recursive=True))

    for filepath in files:
        if not os.path.isfile(filepath): continue
        if "useAppUi.ts" in filepath or "AppContext.tsx" in filepath: continue
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        if "useApp" not in content: continue

        new_content = content.replace(
            'import { useApp } from "@/components/AppContext";',
            'import { useAppUi } from "@/store/hooks/useAppUi";'
        ).replace(
            "import { useApp } from '@/components/AppContext';",
            "import { useAppUi } from '@/store/hooks/useAppUi';"
        ).replace(
            "const { theme, toggleTheme, locale, toggleLocale, t } = useApp();",
            "const { theme, toggleTheme, locale, toggleLocale, t } = useAppUi();"
        ).replace(
            "const { t } = useApp();",
            "const { t } = useAppUi();"
        ).replace(
            "const { theme } = useApp();",
            "const { theme } = useAppUi();"
        ).replace(
            "useApp()",
            "useAppUi()"
        )
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filepath}")

if __name__ == "__main__":
    main()
