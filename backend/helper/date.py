from datetime import datetime
import jdatetime  # Requires 'jdatetime' package


def gregorian_to_shamsi(dt, format_str="%Y/%m/%d %H:%M:%S"):
    """
    Convert Gregorian datetime to Shamsi (Persian) date string

    Args:
        dt (datetime): Django datetime field value
        format_str (str): Output format (default: 'YYYY/MM/DD HH:MM:SS')

    Returns:
        str: Formatted Shamsi date string
        or None if input is None

    Usage:
        created_at_shamsi = gregorian_to_shamsi(obj.created_at)
        created_date_only = gregorian_to_shamsi(obj.created_at, '%Y/%m/%d')
    """
    if dt is None:
        return None

    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt)

    jd = jdatetime.datetime.fromgregorian(datetime=dt)
    return jd.strftime(format_str)
