import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps,
} from 'react-native'
import { X } from 'lucide-react-native'
import { colors, spacing, radius, font } from '../../theme'

interface Props extends Omit<TextInputProps, 'value' | 'onChangeText' | 'onChange'> {
  label: string
  values: string[]
  onChange: (vals: string[]) => void
  placeholder?: string
  required?: boolean
}

export function TagInput({ label, values, onChange, placeholder, required, ...rest }: Props) {
  const [text, setText] = useState('')

  const add = (raw: string) => {
    const trimmed = raw.trim()
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed])
    }
    setText('')
  }

  const handleSubmit = () => add(text)

  const handleChangeText = (v: string) => {
    if (v.endsWith(',')) {
      add(v.slice(0, -1))
    } else {
      setText(v)
    }
  }

  const remove = (val: string) => onChange(values.filter(v => v !== val))

  return (
    <View style={s.wrap}>
      <Text style={s.label}>{label}{required && <Text style={s.req}> *</Text>}</Text>
      {values.length > 0 && (
        <View style={s.tags}>
          {values.map(v => (
            <View key={v} style={s.tag}>
              <Text style={s.tagText} numberOfLines={1}>{v}</Text>
              <TouchableOpacity onPress={() => remove(v)} hitSlop={4}>
                <X size={11} color={colors.text} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <TextInput
        style={s.input}
        value={text}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmit}
        onBlur={handleSubmit}
        placeholder={placeholder ?? 'Type and press Enter or comma'}
        placeholderTextColor={colors.textSubtle}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        {...rest}
      />
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  req: { color: colors.danger },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '33',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    maxWidth: 200,
  },
  tagText: { fontSize: font.sm, color: colors.text, flex: 1 },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    color: colors.text,
    fontSize: font.base,
  },
})
