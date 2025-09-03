"use client";

import ThemeSelector from "./ThemeSelector";
import ColorSchemeToggle from "./ColorSchemeToggle";
import TechniqueSelector from "@/components/breathing/TechniqueSelector";

export default function SettingsPage() {
  return (
    <div className="settings p-4">
      <h1 className="settings__title text-xl font-semibold mb-2">Settings</h1>
      <p className="settings__description text-sm opacity-80">Switch theme and, next, pick breathing technique.</p>
      <section className="settings__section settings__section--theme mt-4">
        <h2 className="settings__heading text-sm font-medium opacity-80">Theme</h2>
        <p className="settings__hint text-xs opacity-60">Swap CSS variable themes to preview styles.</p>
        <div className="mt-2" />
        <ThemeSelector />
      </section>

      <section className="settings__section settings__section--appearance mt-6">
        <h2 className="settings__heading text-sm font-medium opacity-80">Appearance</h2>
        <p className="settings__hint text-xs opacity-60">Light, dark, or follow system.</p>
        <div className="mt-2" />
        <ColorSchemeToggle />
      </section>

      <section className="settings__section settings__section--techniques mt-6 mb-20">
        <h2 className="settings__heading text-sm font-medium opacity-80">Breathing Techniques</h2>
        <p className="settings__hint text-xs opacity-60">Pick a technique to start a session.</p>
        <div className="mt-3" />
        <TechniqueSelector />
      </section>

      {/* <section className="settings__section settings__section--test mt-6">
        <h2 className="settings__heading text-sm font-medium opacity-80">Theme Test</h2>
        <p className="settings__hint text-xs opacity-60">Test all theme properties: radius, shadows, fonts, colors.</p>
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-xs font-medium mb-2 opacity-70">Buttons (radius, shadows, colors)</h3>
            <div className="flex gap-3 flex-wrap">
              <Button variant="default">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-medium mb-2 opacity-70">Cards (radius, shadows, typography)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card>
                <CardHeader>
                  <CardTitle>Theme Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    This tests: background, foreground, border, radius, shadows.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm">Small</Button>
                    <Button size="sm" variant="outline">Outline</Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Typography Test</div>
                    <div className="text-xs text-muted-foreground">
                      Font: {'{--font-sans}'} from theme
                    </div>
                    <div className="text-xs opacity-60">
                      Mono theme = Geist Mono<br/>
                      Other themes = Various fonts
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-medium mb-2 opacity-70">Color Scheme Toggle (inherits theme radius & colors)</h3>
            <ColorSchemeToggle />
          </div>
        </div>
      </section> */}
    </div>
  );
}
