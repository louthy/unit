import { addListeners } from '../../../../../client/addListener'
import {
  ANIMATION_T_MS,
  ifLinearTransition,
  linearTransition,
} from '../../../../../client/animation/animation'
import classnames from '../../../../../client/classnames'
import { setAlpha } from '../../../../../client/color'
import mergePropStyle from '../../../../../client/component/mergeStyle'
import { Context, setColor, setTheme } from '../../../../../client/context'
import { Element } from '../../../../../client/element'
import { makeCustomListener } from '../../../../../client/event/custom'
import { makeInputListener } from '../../../../../client/event/input'
import { graphComponentFromId } from '../../../../../client/graphComponentFromSpec'
import parentElement from '../../../../../client/platform/web/parentElement'
import {
  COLOR_NONE,
  defaultThemeColor,
  themeBackgroundColor,
} from '../../../../../client/theme'
import { userSelect } from '../../../../../client/util/style/userSelect'
import { LINK_DISTANCE } from '../../../../../constant/LINK_DISTANCE'
import { System } from '../../../../../system'
import { Dict } from '../../../../../types/Dict'
import { Unlisten } from '../../../../../types/Unlisten'
import Div from '../../Div/Component'
import Frame from '../../Frame/Component'
import Parent from '../../Parent/Component'
import Color from '../../value/Color/Component'
import Cabinet from '../Cabinet/Component'
import IconButton from '../IconButton/Component'
import Minimap, { MINIMAP_HEIGHT, MINIMAP_WIDTH } from '../Minimap/Component'
import Modes from '../ModeSelector/Component'
import Search from '../Search/Component'

export interface Props {
  className?: string
  style?: Dict<string>
}

export const DEFAULT_UNIT_ID = 'unit'

export const DEFAULT_STYLE = {
  // display: 'none',
  // width: '0px',
  // height: '0px',
  // position: 'absolute',
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  ...userSelect('none'),
}

export default class GUI extends Element<HTMLDivElement, Props> {
  public _gui: Div
  public _background: Div
  public _search: Search
  public _modes: Modes
  public _cabinet: Cabinet
  public _minimap: Minimap
  public _color_picker: Color
  public _color_pallete: Div
  public _share: Div
  public _import: IconButton
  public _export: IconButton
  public _history: Div

  private _hidden = true

  private _manually_changed_color: boolean = false

  constructor($props: Props, $system: System) {
    super($props, $system)

    const { className, style = {} } = this.$props

    const modes = new Modes(
      {
        className: 'graph-gui-crud',
        style: {
          position: 'absolute',
          top: '50%',
          left: '0px',
          transform: 'translate(0%, -50%)',
          backgroundColor: 'none',
          pointerEvents: 'all',
        },
      },
      this.$system
    )

    this._modes = modes

    const search = new Search(
      {
        style: {
          position: 'absolute',
          bottom: '0',
          left: '50%',
          transform: 'translate(-50%, 0%)',
          backgroundColor: 'none',
          pointerEvents: 'all',
        },
      },
      this.$system
    )

    this._search = search

    const minimap = new Minimap(
      {
        width: MINIMAP_WIDTH,
        height: MINIMAP_HEIGHT,
        nodes: {},
        links: {},
        style: {
          position: 'absolute',
          width: '100%',
          height: '100%',
          touchAction: 'none',
        },
        padding: 1 * LINK_DISTANCE,
      },
      this.$system
    )

    this._minimap = minimap

    const history_tree = new Div(
      {
        style: {
          position: 'absolute',
          width: `${MINIMAP_HEIGHT}px`,
          height: `${MINIMAP_HEIGHT * 1.5}`,
          touchAction: 'none',
        },
      },
      this.$system
    )

    this._history = history_tree

    const TOGGLE_SPEC_ID = '6253bf76-2e85-11eb-9f59-3703abfd39c7'
    const { component: color_theme } = graphComponentFromId(
      this.$system,
      TOGGLE_SPEC_ID,
      {
        style: {
          height: '26px',
          marginBottom: '3px',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'currentColor',
          backgroundColor: COLOR_NONE,
        },
        sliderStyle: {
          transition: ifLinearTransition(
            this.$system.animated,
            'left',
            'background-color'
          ),
        },
      }
    )
    color_theme.addEventListener(
      makeInputListener((light: boolean) => {
        if (light) {
          setTheme(this.$context, 'light')
        } else {
          setTheme(this.$context, 'dark')
        }
      })
    )
    const color_picker = new Color(
      {
        value: '#ffffff',
        style: {
          position: 'relative',
          height: 'calc(100% - 28px)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'currentColor',
          boxSizing: 'border-box',
        },
      },
      this.$system
    )
    color_picker.addEventListener(
      makeInputListener((data) => {
        this._manually_changed_color = true
        setColor(this.$context, data)
        this._refresh_color()
      })
    )
    this._color_picker = color_picker

    const color_pallete = new Div(
      {
        style: {
          className: 'gui-color-pallete',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        },
      },
      this.$system
    )
    color_pallete.appendChild(color_theme)
    color_pallete.appendChild(color_picker)
    this._color_pallete = color_pallete

    const export_button = new IconButton(
      {
        icon: 'upload',
        style: {
          width: '21px',
          height: '21px',
          padding: '6px',
        },
      },
      this.$system
    )

    this._export = export_button

    const import_button = new IconButton(
      {
        icon: 'import',
        style: {
          width: '21px',
          height: '21px',
          padding: '6px',
        },
      },
      this.$system
    )

    this._import = import_button

    const share = new Div(
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          height: 'fit-content',
        },
      },
      this.$system
    )
    share.appendChild(export_button)
    share.appendChild(import_button)
    this._share = share

    const cabinet = new Cabinet(
      {
        className: 'graph-gui-cabinet',
        style: {
          backgroundColor: 'none',
          pointerEvents: 'all',
        },
        // hidden: true,
      },
      this.$system
    )
    cabinet.addEventListener(
      makeCustomListener(
        'draweractive',
        ({ drawerId }: { drawerId: string }) => {
          if (drawerId === 'theme') {
            setTheme(this.$context, 'light')
          }
        }
      )
    )
    cabinet.addEventListener(
      makeCustomListener(
        'drawerinactive',
        ({ drawerId }: { drawerId: string }) => {
          if (drawerId === 'theme') {
            setTheme(this.$context, 'dark')
          }
        }
      )
    )

    this._cabinet = cabinet

    const background = new Div(
      {
        className: 'gui-background',
        style: {
          position: 'absolute',
          top: '0px',
          left: '0px',
        },
      },
      this.$system
    )
    this._background = background

    const control = new Frame(
      {
        className: 'gui-control',
        style: {
          position: 'absolute',
          top: '0px',
          overflow: 'visible',
          background: 'none',
          pointerEvents: 'none',
        },
      },
      this.$system
    )
    control.registerParentRoot(modes)
    control.registerParentRoot(search)
    control.registerParentRoot(cabinet)

    const main = new Parent(
      {
        className: 'gui-main',
        style: {},
      },
      this.$system
    )

    const foreground = new Div(
      {
        className: 'gui-foreground',
        style: {
          position: 'absolute',
          top: '0px',
          left: '0px',
          pointerEvents: 'none',
        },
      },
      this.$system
    )

    const gui = new Div(
      {
        className: classnames('gui', className),
        style: {
          ...DEFAULT_STYLE,
          ...style,
        },
      },
      this.$system
    )
    gui.registerParentRoot(background)
    gui.registerParentRoot(main)
    gui.registerParentRoot(control)
    gui.registerParentRoot(foreground)

    this._gui = gui

    this._gui.$ref['control'] = this
    this._gui.$ref['cabinet'] = cabinet
    this._gui.$ref['export'] = export_button
    this._gui.$ref['import'] = import_button
    this._gui.$ref['minimap'] = minimap
    this._gui.$ref['history'] = history_tree
    this._gui.$ref['modes'] = modes
    this._gui.$ref['search'] = search

    const $element = parentElement($system)

    this.$element = $element
    this.$slot['default'] = main
    this.$slot['1'] = background
    this.$slot['2'] = foreground
    this.$slotId = {
      default: 'main',
      '1': 'background',
      '2': 'foreground',
    }
    this.$slotTarget = {
      default: 'default',
      '1': 'default',
      '2': 'default',
    }

    this.$unbundled = false
    this.$primitive = true

    this.setSubComponents({
      background,
      main,
      gui,
      modes,
      search,
      cabinet,
      control,
      foreground,
    })

    this.addEventListeners([
      makeCustomListener('dock-move', ({ dy = 0, dx = 0 }) => {
        if (this._hidden) {
          return
        }

        mergePropStyle(control, {
          left: `${dx}px`,
          width: `calc(100% - ${dx}px)`,
          height: `calc(100% - ${dy}px)`,
          transition: linearTransition('left', 'width', 'height', 'opacity'),
        })

        mergePropStyle(control, {
          left: `${dx}px`,
          width: `calc(100% - ${dx}px)`,
          height: `calc(100% - ${dy}px)`,
          transition: linearTransition('left', 'width', 'height', 'opacity'),
        })

        mergePropStyle(background, {
          paddingBottom: `${dy}px`,
          paddingLeft: `${dx}px`,
          transition: linearTransition('padding-bottom', 'padding-left'),
        })

        if (dy > 0) {
          mergePropStyle(search, {
            borderBottomWidth: '1px',
            borderBottomStyle: 'solid',
            borderBottomColor: 'currentColor',
            borderBottomLeftRadius: '3px',
            borderBottomRightRadius: '3px',
            transition: linearTransition(
              'border-bottom-color',
              'border-bottom-left-radius',
              'border-bottom-right-radius'
            ),
          })
        }
        if (dx > 0) {
          mergePropStyle(modes, {
            borderLeftWidth: '1px',
            borderLeftStyle: 'solid',
            borderLeftColor: 'currentColor',
            borderTopLeftRadius: '3px',
            borderBottomLeftRadius: '3px',
            transition: linearTransition(
              'border-left-color',
              'border-left-top-radius',
              'border-left-bottom-radius'
            ),
          })
        }
      }),
      makeCustomListener('dock-leave', () => {
        if (this._hidden) {
          return
        }

        mergePropStyle(control, {
          left: `${0}px`,
          width: '100%',
          height: `100%`,
        })
        mergePropStyle(search, {
          borderBottomWidth: '1px',
          borderBottomStyle: 'solid',
          borderBottomColor: '#00000000',
          borderBottomLeftRadius: '0px',
          borderBottomRightRadius: '0px',
        })
        mergePropStyle(modes, {
          borderLeftWidth: '1px',
          borderLeftStyle: 'solid',
          borderLeftColor: '#00000000',
          borderTopLeftRadius: '0px',
          borderBottomLeftRadius: '0px',
        })
      }),
    ])

    this.registerRoot(gui)
  }

  private _get_color = (): string => {
    const { $theme, $color } = this.$context
    const { style = {} } = this.$props

    let { color = $color } = style
    // let { color = 'currentColor' } = style

    return color
  }

  private _background_color = (): string => {
    const { $theme } = this.$context
    const backgroundColor = setAlpha(themeBackgroundColor($theme), 0.75)
    return backgroundColor
  }

  private _refresh_color = (): void => {
    const color = this._get_color()
    const backgroundColor = this._background_color()

    mergePropStyle(this._cabinet, {
      backgroundColor,
    })

    mergePropStyle(this._modes, {
      backgroundColor,
    })

    mergePropStyle(this._search, {
      backgroundColor,
    })

    mergePropStyle(this._minimap, {
      color,
    })
  }

  onPropChanged(prop: string, current: any): void {
    // console.log('GUI', 'onPropChanged', prop, current)

    if (prop === 'style') {
      this._gui.setProp('style', { ...DEFAULT_STYLE, ...current })

      this._refresh_color()
    }
  }

  private _init: boolean = false

  private _context_unlisten: Unlisten

  onMount() {
    // console.log('GUI', 'onMount')
    if (!this._init) {
      const { $height } = this.$context

      const cy = $height / 2

      this._cabinet.addDrawers({
        minimap: {
          icon: 'graph',
          title: 'minimap',
          component: this._minimap,
          active: false,
          width: MINIMAP_WIDTH,
          height: MINIMAP_HEIGHT,
          state: { y: cy - 82.765 },
        },
        color: {
          icon: 'palette',
          title: 'color',
          component: this._color_pallete,
          active: false,
          width: 100,
          height: 100,
          state: { y: cy - 17.5 },
        },
        file: {
          icon: 'share-2',
          title: 'share',
          component: this._share,
          active: false,
          width: 30,
          height: 67,
          state: { y: cy + 47.765 },
        },
      })

      this._init = true

      if (this._hidden) {
        this.hide(false)
      }
    }

    this._context_unlisten = addListeners(this.$context, [
      makeCustomListener('themechanged', this._on_context_theme_changed),
      makeCustomListener('colorchanged', this._on_context_color_changed),
    ])

    this._refresh_color()
  }

  onUnmount($context: Context) {
    // console.log('GUI', 'onUnmount')

    this._context_unlisten()
  }

  private _on_context_theme_changed = (): void => {
    // console.log('GUI', '_on_context_theme_changed')

    const { $theme } = this.$context

    if (this.$context.$parent === null) {
      document.body.style.backgroundColor = themeBackgroundColor($theme)
    }

    if (!this._manually_changed_color) {
      const default_theme_color = defaultThemeColor($theme)

      setColor(this.$context, default_theme_color)

      this._color_picker.setProp('value', default_theme_color)
    }

    this._refresh_color()
  }

  private _on_context_color_changed = (): void => {
    // console.log('GUI', 'colorchanged')

    this._refresh_color()
  }

  public hide(animate: boolean = false): void {
    // console.log('GUI', 'hide', animate)

    this._hidden = true

    this.hide_background(animate)
    this.hide_search(animate)
    this.hide_modes(animate)
    this.hide_cabinet(animate)
  }

  public is_hidden(): boolean {
    return this._hidden
  }

  private _animate_background = (
    style: Dict<string>,
    animate: boolean
  ): void => {
    const duration = animate ? ANIMATION_T_MS : 0
    const fill = 'forwards'

    this._background.$element?.animate?.(style, {
      duration,
      fill,
    })
  }

  private _animate_search = (style: Dict<string>, animate: boolean) => {
    const duration = animate ? ANIMATION_T_MS : 0
    const fill = 'forwards'

    if (this._search_animation) {
      this._search_animation.pause()
      this._search_animation.commitStyles()
    }

    this._search_animation = this._search._search.$element?.animate?.(style, {
      duration,
      fill,
    })
  }

  public hide_background = (animate: boolean): void => {
    this._animate_background(
      {
        opacity: '0.25',
      },
      animate
    )
  }

  public hide_search = (animate: boolean): void => {
    // this._animate_search(
    //   {
    //     transform: 'translate(-50%, 100%)',
    //   },
    //   animate
    // )
    mergePropStyle(this._search, {
      transform: 'translate(-50%, 100%)',
      transition: ifLinearTransition(animate, 'transform'),
    })
  }

  private _modes_animation: Animation
  private _search_animation: Animation

  private _animate_modes = (style: Dict<string>, animate: boolean): void => {
    const duration = animate ? ANIMATION_T_MS : 0
    const fill = 'forwards'

    if (this._modes_animation) {
      this._modes_animation.pause()
      this._modes_animation.commitStyles()
    }

    this._modes_animation = this._modes._modes.$element.animate?.([style], {
      duration,
      fill,
    })
  }

  public hide_modes = (animate: boolean = true): void => {
    // this._animate_modes(
    //   {
    //     transform: 'translate(-100%, -50%)',
    //   },
    //   animate
    // )
    mergePropStyle(this._modes, {
      transform: 'translate(-100%, -50%)',
      transition: ifLinearTransition(animate, 'transform'),
    })
  }

  public hide_cabinet = (animate: boolean): void => {
    this._cabinet.hide(animate)
  }

  public show_background = (animate: boolean): void => {
    this._animate_background(
      {
        opacity: '1',
      },
      animate
    )
  }

  public show_search = (animate: boolean): void => {
    // this._animate_search(
    //   {
    //     transform: 'translate(-50%, 0%)',
    //   },
    //   animate
    // )
    mergePropStyle(this._search, {
      transform: 'translate(-50%, 0%)',
      transition: ifLinearTransition(animate, 'transform'),
    })
  }

  public show_modes = (animate: boolean): void => {
    // this._animate_modes(
    //   {
    //     transform: 'translate(0%, -50%)',
    //   },
    //   animate
    // )
    mergePropStyle(this._modes, {
      transform: 'translate(0%, -50%)',
      transition: ifLinearTransition(animate, 'transform'),
    })
  }

  public show_cabinet = (animate: boolean): void => {
    this._cabinet.show(animate)
  }

  public show(animate: boolean): void {
    // console.log('GUI', 'show', animate)

    this._hidden = false

    this.show_background(animate)

    this.show_search(animate)
    this.show_modes(animate)
    this.show_cabinet(animate)
  }
}
