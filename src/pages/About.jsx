// 어바웃 페이지
import useAboutStore from '../store/useAboutStore'
import useSettingsStore from '../store/useSettingsStore'
import AboutHeader from './about/AboutHeader'
import AboutOtaku from './about/AboutOtaku'
import AboutTrpg from './about/AboutTrpg'

export default function About() {
  const { nickname } = useSettingsStore()
  const { otakuProfile, profile, updateOtakuProfile } = useAboutStore()

  return (
    <div className="animate-fade-in">
      <AboutHeader otaku={otakuProfile} updateOtaku={updateOtakuProfile} nickname={nickname} />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        <AboutOtaku otaku={otakuProfile} updateOtaku={updateOtakuProfile} profile={profile} />
        <AboutTrpg otaku={otakuProfile} updateOtaku={updateOtakuProfile} />
      </div>
    </div>
  )
}
